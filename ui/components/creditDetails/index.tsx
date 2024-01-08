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

function CreditsUI() {
	return (
		<div className="credit-details-container">
			<div className="credit-details-sub-container">
				Credits remaining : <span>20</span>
			</div>
			<div className="credit-details-sub-container">
				Credits used : <span>10</span>
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
