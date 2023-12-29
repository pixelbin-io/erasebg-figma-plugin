import eraseBgOptions from "../constants";

// console.log("PixelBin", pixelbin);
// Handle the execution of the first command
// if (figma.command == "plugin-command")
// 	figma.closePlugin("The plugin command was executed");

// Configure the command that involves a UI

// Present a UI, providing it with Figma CSS color variables
figma.showUI(__html__, {
	title: "Erase Bg",
	height: 400,
	width: 248,
	themeColors: true,
});

// Create a variable to store the rectangles that will be created
const rectangles: RectangleNode[] = [];

/* Handle the message from the UI, being aware that it will be an object with the single `count` property */
figma.ui.onmessage = async (msg) => {
	var node: any = figma?.currentPage?.selection[0];
	if (msg.type === "initialCall") {
		const body = {
			type: "createForm",
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
				console.error("Error loading data:", err);
			});
	}

	if (msg.type === "transform") {
		if (msg.params) {
			figma.clientStorage
				.setAsync("savedFormValue", msg.params)
				.then(() => {})
				.catch((err) => {
					console.error("Error saving data:", err);
				});
		}
		if (!figma.currentPage.selection.length)
			figma.notify("Please select a image");

		if (figma.currentPage.selection.length > 1)
			figma.notify("Please select a single image");
		else {
			node = figma.currentPage.selection[0];
			if (node.fills[0].type === "IMAGE") {
				const image = figma.getImageByHash(node.fills[0].imageHash);
				let bytes: any = null;
				if (image) {
					bytes = await image.getBytesAsync();
					figma.ui.postMessage({
						type: "selectedImage",
						imageBytes: bytes,
						imageName: node?.name?.replace(/ /g, ""),
					});
				}
			}
		}
	}
	if (msg.type === "replace-image") {
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
			})
			.catch((err) => {
				figma.notify("Something went wrong");
			});
	} else if (msg.type === "close-plugin") figma.closePlugin();
};
