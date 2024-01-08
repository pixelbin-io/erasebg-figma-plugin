export const eraseBgOptions = [
	{
		name: "Industry Type",
		type: "enum",
		enum: ["general", "ecommerce", "car", "human"],
		preview: ["car"],
		default: "general",
		identifier: "i",
		title: "Industry type",
	},
	{
		name: "Add Shadow",
		title: "Add Shadow (cars only)",
		type: "boolean",
		default: false,
		preview: false,
		identifier: "shadow",
	},
	{
		name: "Refine",
		title: "Refine Output",
		type: "boolean",
		default: true,
		identifier: "r",
	},
];

export enum msgTypes {
	TOGGLE_LOADER = "toggle-loader",
	INITIAL_CALL = "initial-call",
	CREATE_FORM = "create-form",
	TRANSFORM = "transform",
	REPLACE_IMAGE = "replace-image",
	SELCTED_IMAGE = "selected-image",
	SAVE_TOKEN = "save-token",
	IS_TOKEN_SAVED = "is-token-saved",
	OPEN_EXTERNAL_URL = "open-external-url",
}
