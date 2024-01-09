import React from "react";
import "../../styles/style.scss";
import { PIXELBIN_CONSOLE_SETTINGS } from "../../../config";
import { EVENTS } from "../../../constants";

const { OPEN_EXTERNAL_URL } = EVENTS;

function handleLinkClick(url: string) {
	parent.postMessage(
		{
			pluginMessage: {
				type: OPEN_EXTERNAL_URL,
				url,
			},
		},
		"*"
	);
}

function abbreviateNumber(number = 0) {
	number = Math.round(number);

	const SI_SYMBOL = ["", "K", "M", "G", "T", "P", "E"];

	// what tier? (determines SI symbol)
	const tier = Math.floor(Math.log10(Math.abs(number)) / 3);

	// if zero, we don't need a suffix
	if (tier == 0) return number;

	// get suffix and determine scale
	const suffix = SI_SYMBOL[tier];
	const scale = Math.pow(10, tier * 3);

	// scale the number
	const scaled = number / scale;

	// format number and add suffix
	return parseFloat(scaled.toFixed(1)) + suffix;
}

interface creditsProps {
	creditUSed: any;
	totalCredit: any;
}

function CreditsUI({ creditUSed, totalCredit }: creditsProps) {
	return (
		<div className="credit-details-container">
			<div className="credit-details-sub-container">
				Credits : {abbreviateNumber(creditUSed)}/{abbreviateNumber(totalCredit)}{" "}
				used
			</div>
			<div
				onClick={() => {
					handleLinkClick(`${PIXELBIN_CONSOLE_SETTINGS}/billing/pricing`);
				}}
				className="buy-credits-btn"
			>
				Buy credits
			</div>
		</div>
	);
}

export default CreditsUI;
