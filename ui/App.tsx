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
import Loader from "./components/loader";

function App() {
	const [formValues, setFormValues] = useState<any>({});
	const [isLoading, setIsLoading] = useState(false);
	const [isTokenSaved, setIsTokenSaved] = useState(false);
	const [tokenValue, setTokenValue] = useState(null);
	const [tokenErr, setTokenErr] = useState(false);
	const [isTokenEditOn, setIsTokenEditOn] = useState(false);
	const [isCancellable, setIsCancellable] = useState(false);
	const [isReqCancelled, setIsReqCancelled] = useState(false);
	const [cloudName, setCloudName] = useState("");
	const [creditsUsed, setCreditUSed] = useState(0);
	const [totalCredit, setTotalCredit] = useState(0);

	var isReqCancelledVar = false;

	const {
		INITIAL_CALL,
		CREATE_FORM,
		TOGGLE_LOADER,
		IS_TOKEN_SAVED,
		SAVE_TOKEN,
		TRANSFORM,
		SELCTED_IMAGE,
		REPLACE_IMAGE,
		DELETE_TOKEN,
	} = EVENTS;

	const abortController = new AbortController();
	const signal = abortController.signal;

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

	// useEffect(() => {
	// 	pixelbin = new Pixelbin({
	// 		cloudName: `${cloudName}`,
	// 		zone: "default", // optional
	// 	});
	// }, [cloudName]);

	window.onmessage = async (event) => {
		const { data } = event;
		if (data.pluginMessage.type === IS_TOKEN_SAVED) {
			setIsTokenSaved(data.pluginMessage.value);
			if (data.pluginMessage.value) {
				setTokenValue(data.pluginMessage.savedToken);
				setCloudName(data.pluginMessage.savedCloudName);

				let temp = { ...formValues };
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
			if (data.pluginMessage.isTokenEditing) setIsTokenEditOn(true);
		}
		if (data.pluginMessage.type === CREATE_FORM) {
			console.log("I am called", formValues);
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

			console.log("cloudNAmeHere", data.pluginMessage.savedCloudName);
			var pixelbin = new Pixelbin({
				cloudName: `${data.pluginMessage.savedCloudName}`,
				zone: "default", // optional
			});

			// const newData = await defaultPixelBinClient.billing.getUsage();
			// console.log("newData", newData);
			// const cu = newData.credits.used;
			// const cr = newData?.total?.credits;

			// setCreditUSed(cu);
			// setTotalCredit(cr);

			const EraseBg = transformations.EraseBG;
			let name = `${data?.pluginMessage?.imageName}${uuidv4()}`;

			res = await defaultPixelBinClient.assets.createSignedUrlV2({
				...createSignedURlDetails,
				name: name,
			});

			function uploadWithRetry(blob, presignedUrl, options) {
				return Pixelbin.upload(blob, presignedUrl, options)
					.then(() => {
						// console.log("isReqCancelled", isReqCancelledVar);
						// if (isReqCancelledVar) {
						// 	console.log("isReqCancelled2", isReqCancelledVar);
						// 	isReqCancelledVar = false;
						// 	return;
						// } else {
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
						setCreditsDetails();

						// }
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
				// signal: signal,
			}).catch((err) => console.log("Final error:", err));
		}
		if (data.pluginMessage.type === TOGGLE_LOADER) {
			setIsLoading(data.pluginMessage.value);
			setIsCancellable(data.pluginMessage.value);
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
			console.log("orgDetails", orgDetails);
			parent.postMessage(
				{
					pluginMessage: {
						type: SAVE_TOKEN,
						value: tokenValue,
						cloudName: orgDetails?.org?.cloudName,
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
		setTokenValue(null);
		parent.postMessage(
			{
				pluginMessage: {
					type: DELETE_TOKEN,
				},
			},
			"*"
		);
	}

	function onAbort() {
		// console.log("Aborted");
		// setIsReqCancelled(true);
		// isReqCancelledVar = true;
		// abortController.abort();
		// setIsLoading(false);
		// setIsCancellable(false);
		// console.log("ENd Aborted");
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

	async function setCreditsDetails() {
		if (tokenValue && tokenValue !== null) {
			console.log("tokenValue2", tokenValue);
			const defaultPixelBinClient: PixelbinClient = new PixelbinClient(
				new PixelbinConfig({
					domain: `${PIXELBIN_IO}`,
					apiSecret: `${tokenValue}`,
				})
			);

			PdkAxios.defaults.withCredentials = false;

			const newData = await defaultPixelBinClient.billing.getUsage();
			console.log("newData", newData);
			const cu = newData.credits.used;
			const cr = newData?.total?.credits;

			setCreditUSed(cu);
			setTotalCredit(cr);
		}
	}

	useEffect(() => {
		console.log("tokenValue1", tokenValue);
		setCreditsDetails();
	}, [tokenValue]);

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
						<CreditsUI totalCredit={totalCredit} creditUSed={creditsUsed} />
					</div>
					<div className="bottom-btn-container">
						<div className="reset-container" id="reset" onClick={handleReset}>
							<div className="icon icon--swap icon--blue reset-icon"></div>
							<div className="reset-text">Reset all</div>
						</div>
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
			{isLoading && <Loader isCancellable={false} onCancelClick={onAbort} />}
		</div>
	);
}

export default App;
