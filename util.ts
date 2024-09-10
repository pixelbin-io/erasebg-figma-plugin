import packageInfo from "./package.json";

export class Util {
	static generateUserAgent() {
		return `ErasebgPlugin/${packageInfo.version} (Figma)`;
	}

	// Function to add two numbers
	static camelCase(str: string) {
		return str
			.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
				return index == 0 ? word.toLowerCase() : word.toUpperCase();
			})
			.replace(/\s+/g, "");
	}
}
