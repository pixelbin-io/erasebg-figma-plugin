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

export enum EVENTS {
	TOGGLE_LOADER = "toggle-loader",
	INITIAL_CALL = "initial-call",
	CREATE_FORM = "create-form",
	TRANSFORM = "transform",
	REPLACE_IMAGE = "replace-image",
	SELCTED_IMAGE = "selected-image",
	SAVE_TOKEN = "save-token",
	IS_TOKEN_SAVED = "is-token-saved",
	OPEN_EXTERNAL_URL = "open-external-url",
	DELETE_TOKEN = "delete-token",
	CLOSE_PLUGIN = "close-plugin",
}

export enum COMMANDS {
	HOW_IT_WORKS_CMD = "how-it-works-command",
	TOKEN_RESET_CMD = "token-reset-command",
}

export const PERSISTED_TOKEN = "persistedToken";
export const SAVED_FORM_VALUE = "savedFormValue";
export const IMAGE = "IMAGE";
export const CLOUD_NAME = "cloudName";
export const ORG_ID = "organisationId";
export const UTM_DETAILS =
	"utm_source=figma&utm_medium=plugin&utm_campaign=erasebg";

export const createSignedURlDetails = {
	path: "__figma/ebg",
	format: "jpeg",
	access: "public-read",
	tags: ["tag1", "tag2"],
	metadata: {},
	overwrite: false,
	filenameOverride: false,
};

export const uploadOptions = {
	chunkSize: 2 * 1024 * 1024,
	maxRetries: 1,
	concurrency: 2,
};
