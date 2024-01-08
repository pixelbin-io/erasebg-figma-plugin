import { eraseBgOptions, EVENTS } from "../constants";
import { HOW_IT_WORKS_URL } from "../config";

//Append the UI
figma.showUI(__html__, {
	title: "Erase.bg",
	height: 400,
	width: 248,
	themeColors: true,
});

const rectangles: RectangleNode[] = [];
const {
	INITIAL_CALL,
	CREATE_FORM,
	TOGGLE_LOADER,
	IS_TOKEN_SAVED,
	SAVE_TOKEN,
	TRANSFORM,
	SELCTED_IMAGE,
	OPEN_EXTERNAL_URL,
	REPLACE_IMAGE,
} = EVENTS;

if (figma.command === "how-it-works-command") {
	figma.openExternal(HOW_IT_WORKS_URL);
}

function toggleLoader(value: boolean) {
	figma.ui.postMessage({
		type: TOGGLE_LOADER,
		value,
	});
}

/* Handle the message from the UI */
figma.ui.onmessage = async (msg) => {
	var node: any = figma?.currentPage?.selection[0];
	var savedToken;
	if (msg.type === INITIAL_CALL) {
		const body = {
			type: CREATE_FORM,
			optionsArray: eraseBgOptions,
			savedFormValue: "",
		};

		try {
			savedToken = await figma.clientStorage.getAsync("persistedToken");
			if (savedToken !== undefined && savedToken !== null) {
				figma.ui.postMessage({
					type: IS_TOKEN_SAVED,
					value: true,
					savedFormValue: "",
					isTokenEditing: figma.command === "token-reset-command",
					savedToken,
				});
			} else {
				figma.ui.postMessage({
					type: IS_TOKEN_SAVED,
					value: false,
					savedFormValue: "",
					isTokenEditing: figma.command === "token-reset-command",
				});
			}
		} catch (err) {
			console.log("err", err);
		}
	}
	if (msg.type === SAVE_TOKEN) {
		figma.clientStorage
			.setAsync("persistedToken", msg.value)
			.then(() => {
				const body = {
					type: CREATE_FORM,
					optionsArray: eraseBgOptions,
					savedFormValue: "",
				};
				figma.clientStorage
					.getAsync("savedFormValue")
					.then((value) => {
						body.savedFormValue = value;
						figma.ui.postMessage(body);
					})
					.catch((err) => {
						figma.ui.postMessage(body);
					});
			})
			.catch((err) => {
				console.error("Error saving token:", err);
			});
	}
	if (msg.type === "delete-token") {
		figma.clientStorage.deleteAsync("persistedToken");
	}

	if (msg.type === TRANSFORM) {
		if (msg.params) {
			figma.clientStorage
				.setAsync("savedFormValue", msg.params)
				.then(() => {
					console.log("Data Saved");
				})
				.catch((err) => {
					console.error("Error saving data:", err);
				});
		}
		if (!figma.currentPage.selection.length) {
			figma.notify("Please select a image");
			return;
		}

		if (figma.currentPage.selection.length > 1) {
			figma.notify("Please select a single image");
			return;
		} else {
			node = figma.currentPage.selection[0];
			if (node.fills[0].type !== "IMAGE") {
				figma.notify("Make sure you are selecting an image");
				return;
			}
			if (node.fills[0].type === "IMAGE") {
				toggleLoader(true);
				const image = figma.getImageByHash(node.fills[0].imageHash);
				let bytes: any = null;
				let token = await figma.clientStorage.getAsync("persistedToken");
				if (image) {
					bytes = await image.getBytesAsync();
					figma.ui.postMessage({
						type: SELCTED_IMAGE,
						imageBytes: bytes,
						imageName: node?.name?.replace(/ /g, ""),
						token,
					});
				}
			}
		}
	}
	if (msg.type === OPEN_EXTERNAL_URL) {
		figma.openExternal(msg.url);
	}
	if (msg.type === REPLACE_IMAGE) {
		figma
			.createImageAsync(msg?.bgRemovedUrl)
			.then(async (image: Image) => {
				node.fills = [
					{
						type: "IMAGE",
						imageHash: image.hash,
						scaleMode: "FILL",
					},
				];
				toggleLoader(false);
				figma.notify(
					"Transformation Applied (you can use (ctrl/command + z/y) or  to undo/redo tranformation)",
					{ timeout: 5000 }
				);
			})
			.catch((err) => {
				figma.notify("Something went wrong");
			});
	} else if (msg.type === "close-plugin") figma.closePlugin();
};
