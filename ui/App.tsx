import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { PdkAxios } from "@pixelbin/admin/common.js";
import { PixelbinConfig, PixelbinClient } from "@pixelbin/admin";
import { eraseBgOptions, EVENTS, createSignedURlDetails } from "./../constants";
import { Util } from "./../util.ts";
import "./styles/style.scss";
import Pixelbin, { transformations } from "@pixelbin/core";
import LoaderGif from "../assets/loader.gif";
import { PIXELBIN_IO } from "../config";
import CreditsUI from "./components/creditDetails";
import TokenUI from "./components/TokenUI";
import DynamicForm from "./components/dynamicForm";

function App() {
	const [formValues, setFormValues] = useState<any>({});
	const [isLoading, setIsLoading] = useState(false);
	const [isTokenSaved, setIsTokenSaved] = useState(false);
	const [tokenValue, setTokenValue] = useState(null);
	const [tokenErr, setTokenErr] = useState(false);
	const [isTokenEditOn, setIsTokenEditOn] = useState(false);

	const {
		INITIAL_CALL,
		CREATE_FORM,
		TOGGLE_LOADER,
		IS_TOKEN_SAVED,
		SAVE_TOKEN,
		TRANSFORM,
		SELCTED_IMAGE,
		REPLACE_IMAGE,
	} = EVENTS;

	useEffect(() => {
		parent.postMessage(
			{
				pluginMessage: {
					type: INITIAL_CALL,
				},
			},
			"*"
		);
	}, []);

	window.onmessage = async (event) => {
		const { data } = event;
		if (data.pluginMessage.type === IS_TOKEN_SAVED) {
			setIsTokenSaved(data.pluginMessage.value);
			if (data.pluginMessage.value)
				setTokenValue(data.pluginMessage.savedToken);
			if (data.pluginMessage.isTokenEditing) setIsTokenEditOn(true);
		}
		if (data.pluginMessage.type === CREATE_FORM) {
			let temp = { ...formValues };
			setIsTokenSaved(true);
			eraseBgOptions.forEach((option, index) => {
				const camelCaseName = Util.camelCase(option.name);
				const savedValue = data.pluginMessage.savedFormValue[camelCaseName];

				temp[camelCaseName] =
					savedValue !== undefined && savedValue !== null
						? savedValue
						: option.default;
			});
			setFormValues({ ...temp });
		}
		if (data.pluginMessage.type === SELCTED_IMAGE) {
			const defaultPixelBinClient: PixelbinClient = new PixelbinClient(
				new PixelbinConfig({
					domain: `${PIXELBIN_IO}`,
					apiSecret: `${data.pluginMessage.token}`,
				})
			);

			PdkAxios.defaults.withCredentials = false;

			let res = null;
			let blob = new Blob([data.pluginMessage.imageBytes], {
				type: "image/jpeg",
			});

			const pixelbin = new Pixelbin({
				cloudName: "muddy-lab-41820d",
				zone: "default", // optional
			});

			const EraseBg = transformations.EraseBG;
			let name = `${data?.pluginMessage?.imageName}${uuidv4()}`;

			res = await defaultPixelBinClient.assets.createSignedUrlV2({
				...createSignedURlDetails,
				name: name,
			});

			function uploadWithRetry(blob, presignedUrl, options) {
				return Pixelbin.upload(blob, presignedUrl, options)
					.then(() => {
						const url = JSON.parse(
							presignedUrl.fields["x-pixb-meta-assetdata"]
						);
						const demoImage = pixelbin.image(url?.fileId);
						demoImage.setTransformation(EraseBg.bg(formValues));
						parent.postMessage(
							{
								pluginMessage: {
									type: REPLACE_IMAGE,
									bgRemovedUrl: demoImage.getUrl(),
								},
							},
							"*"
						);
					})
					.catch((err) => {
						console.log(`Retry upload`);
						return uploadWithRetry(blob, presignedUrl, options);
					});
			}

			uploadWithRetry(blob, res?.presignedUrl, {
				chunkSize: 2 * 1024 * 1024,
				maxRetries: 1,
				concurrency: 2,
			}).catch((err) => console.log("Final error:", err));
		}
		if (data.pluginMessage.type === TOGGLE_LOADER) {
			setIsLoading(data.pluginMessage.value);
		}
	};

	function handleReset() {
		let temp = { ...formValues };
		eraseBgOptions.forEach((option, index) => {
			const camelCaseName = Util.camelCase(option.name);
			temp[camelCaseName] = option.default;
		});
		setFormValues({ ...temp });
	}

	async function handleTokenSave() {
		setTokenErr(false);
		setIsLoading(true);

		const defaultPixelBinClient: PixelbinClient = new PixelbinClient(
			new PixelbinConfig({
				domain: `${PIXELBIN_IO}`,
				apiSecret: tokenValue,
			})
		);

		PdkAxios.defaults.withCredentials = false;

		try {
			const orgDetails =
				await defaultPixelBinClient.organization.getAppOrgDetails();
			parent.postMessage(
				{
					pluginMessage: {
						type: SAVE_TOKEN,
						value: tokenValue,
					},
				},
				"*"
			);
			setIsLoading(false);
			setIsTokenEditOn(false);
		} catch (err) {
			setTokenErr(true);
			setIsLoading(false);
		}
	}

	function handleTokenDelete() {
		tokenValue("");
		parent.postMessage(
			{
				pluginMessage: {
					type: "delete-token",
				},
			},
			"*"
		);
	}

	function handleSubmit() {
		parent.postMessage(
			{
				pluginMessage: {
					type: TRANSFORM,
					params: formValues,
				},
			},
			"*"
		);
	}

	return (
		<div className={`main-container ${isLoading ? "hide-overflow" : ""}`}>
			{isTokenSaved && !isTokenEditOn ? (
				<div className="main-ui-container">
					<div>
						<div id="options-wrapper">
							<DynamicForm
								setFormValues={setFormValues}
								formValues={formValues}
							/>
						</div>
						<CreditsUI />
					</div>
					<div className="bottom-btn-container">
						<div className="reset-container" id="reset" onClick={handleReset}>
							<div className="icon icon--swap icon--blue reset-icon"></div>
							<div className="reset-text">Reset all</div>
						</div>
						<button
							id="delete-token"
							onClick={handleTokenDelete}
							style={{
								color: "transparent",
								background: "transparent",
								border: "none",
								cursor: "pointer",
							}}
						>
							D
						</button>
						<button
							id="submit-btn"
							onClick={handleSubmit}
							className="button button--primary"
						>
							Apply
						</button>
					</div>
				</div>
			) : (
				<TokenUI
					tokenValue={tokenValue}
					tokenErr={tokenErr}
					setTokenValue={setTokenValue}
					handleTokenDelete={handleTokenDelete}
					handleTokenSave={handleTokenSave}
				/>
			)}
			{isLoading && (
				<div className="loader-modal">
					<img src={LoaderGif} alt="Loader" height={50} width={50} />
				</div>
			)}
		</div>
	);
}

export default App;
