import {
	eraseBgOptions,
	EVENTS,
	COMMANDS,
	PERSISTED_TOKEN,
	SAVED_FORM_VALUE,
	IMAGE,
	CLOUD_NAME,
} from "../constants";
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
	DELETE_TOKEN,
	CLOSE_PLUGIN,
} = EVENTS;

const { HOW_IT_WORKS_CMD, TOKEN_RESET_CMD } = COMMANDS;

if (figma.command === HOW_IT_WORKS_CMD) {
	figma.openExternal(`${HOW_IT_WORKS_URL}/GoFynd/PixelBin/_git/samui`);
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
	var savedToken, savedCloudName, savedFomValue;
	if (msg.type === INITIAL_CALL) {
		const body = {
			type: CREATE_FORM,
			optionsArray: eraseBgOptions,
			savedFormValue: "",
			savedCloudName: "",
		};

		try {
			savedToken = await figma.clientStorage.getAsync(PERSISTED_TOKEN);
			savedCloudName = await figma.clientStorage.getAsync(CLOUD_NAME);
			savedFomValue = await figma.clientStorage.getAsync(SAVED_FORM_VALUE);

			if (savedToken !== undefined && savedToken !== null) {
				figma.ui.postMessage({
					type: IS_TOKEN_SAVED,
					value: true,
					savedFormValue: "",
					isTokenEditing: figma.command === TOKEN_RESET_CMD,
					savedToken,
					savedCloudName,
					savedFomValue,
				});
			} else {
				figma.ui.postMessage({
					type: IS_TOKEN_SAVED,
					value: false,
					savedFormValue: "",
					isTokenEditing: figma.command === TOKEN_RESET_CMD,
				});
			}
		} catch (err) {
			figma.notify("Something wnet wrong");
		}
	}
	if (msg.type === SAVE_TOKEN) {
		figma.clientStorage
			.setAsync(PERSISTED_TOKEN, msg.value)
			.then(() => {
				figma.clientStorage
					.setAsync(CLOUD_NAME, msg.cloudName)
					.then(() => {})
					.catch(() => {});

				const body = {
					type: CREATE_FORM,
					optionsArray: eraseBgOptions,
					savedFormValue: "",
					cloudName: "",
				};

				figma.clientStorage
					.getAsync(CLOUD_NAME)
					.then((value) => {
						body.cloudName = value;
					})
					.catch((err) => {});

				figma.clientStorage
					.getAsync(SAVED_FORM_VALUE)
					.then((value) => {
						console.log("LAtestForm", value);
						body.savedFormValue = value;
						figma.ui.postMessage(body);
					})
					.catch((err) => {
						console.log("LAtestFormErr");
						figma.ui.postMessage(body);
					});
			})
			.catch((err) => {
				console.error("Error saving token:", err);
			});
	}
	if (msg.type === DELETE_TOKEN) {
		figma.clientStorage
			.deleteAsync(PERSISTED_TOKEN)
			.then(() => {
				console.log("Deleted");
			})
			.catch((err) => {
				console.log("err", err);
			});
	}

	if (msg.type === TRANSFORM) {
		if (msg.params) {
			figma.clientStorage
				.setAsync(SAVED_FORM_VALUE, msg.params)
				.then(() => {
					console.log("Data Saved", msg.params);
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
			if (node.fills[0].type !== IMAGE) {
				figma.notify("Make sure you are selecting an image");
				return;
			}
			if (node.fills && node.fills.length && node?.fills[0]?.type === IMAGE) {
				toggleLoader(true);
				const image = figma.getImageByHash(node.fills[0].imageHash);
				let bytes: any = null;
				let token = await figma.clientStorage.getAsync(PERSISTED_TOKEN);
				let savedCloudName = await figma.clientStorage.getAsync(CLOUD_NAME);
				if (image) {
					bytes = await image.getBytesAsync();
					figma.ui.postMessage({
						type: SELCTED_IMAGE,
						imageBytes: bytes,
						imageName: node?.name?.replace(/ /g, ""),
						token,
						savedCloudName,
					});
				}
			} else {
				figma.notify("Make sure you are selecting an image");
				return;
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
						type: IMAGE,
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
	} else if (msg.type === CLOSE_PLUGIN) figma.closePlugin();
};
