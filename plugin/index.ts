import { eraseBgOptions, msgTypes } from "../constants";

//Append the UI
figma.showUI(__html__, {
	title: "Erase.bg",
	height: 400,
	width: 248,
	themeColors: true,
});

const rectangles: RectangleNode[] = [];

function toggleLoader(value: boolean) {
	figma.ui.postMessage({
		type: msgTypes.TOGGLE_LOADER,
		value,
	});
}

/* Handle the message from the UI */
figma.ui.onmessage = async (msg) => {
	var node: any = figma?.currentPage?.selection[0];
	var savedToken;
	if (msg.type === msgTypes.INITIAL_CALL) {
		const body = {
			type: msgTypes.CREATE_FORM,
			optionsArray: eraseBgOptions,
			savedFormValue: "",
		};

		try {
			savedToken = await figma.clientStorage.getAsync("persistedToken");
			console.log("persistedToken", savedToken);
			if (savedToken !== undefined && savedToken !== null) {
				figma.ui.postMessage({
					type: msgTypes.IS_TOKEN_SAVED,
					value: true,
					savedFormValue: "",
				});
			} else {
				figma.ui.postMessage({
					type: msgTypes.IS_TOKEN_SAVED,
					value: false,
					savedFormValue: "",
				});
			}
		} catch (err) {
			console.log("err", err);
		}
	}
	if (msg.type === msgTypes.SAVE_TOKEN) {
		console.log("PAssed values", msg.value);
		figma.clientStorage
			.setAsync("persistedToken", msg.value)
			.then(() => {
				console.log("Token Saved");
				const body = {
					type: msgTypes.CREATE_FORM,
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

		figma.clientStorage
			.getAsync("persistedToken")
			.then((value) => {
				console.log("SAVED VALUE", value);
			})
			.catch((err) => {
				console.log("SAVED VALUE ERR", err);
			});
	}
	if (msg.type === "delete-token") {
		console.log(
			"BRFOE DELETION",
			await figma.clientStorage.getAsync("persistedToken")
		);
		figma.clientStorage.deleteAsync("persistedToken");
		console.log("Key Deleted");
		figma.clientStorage
			.getAsync("persistedToken")
			.then((value) => {
				console.log("Value after Deletion", value);
			})
			.then((err) => {
				console.log("Value after Deletion Err", err);
			});
	}

	if (msg.type === msgTypes.TRANSFORM) {
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
			console.log("Persisted Value 2", savedToken);
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
						type: msgTypes.SELCTED_IMAGE,
						imageBytes: bytes,
						imageName: node?.name?.replace(/ /g, ""),
						token,
					});
				}
			}
		}
	}
	if (msg.type === msgTypes.REPLACE_IMAGE) {
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
