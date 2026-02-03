let config = {
	address: "0.0.0.0",
	ipWhitelist: [],
	port: 8080,

	modules: [
		{
			module: "MMM-TouchOverlay",
			position: "fullscreen_below",
			config: {
				animationSpeed: 200,
				backdropOpacity: 0.8,
				closeButtonSize: 48,
				hideUITogglePosition: "bottom-right",
				calendarDaysToShow: 14,
				timeFormat: 12,
				units: "imperial",
				persistUIState: false,
				autoHideDelay: 0,
				photoViewer: {
					showMetadata: true,
					slideshowPauseEnabled: true
				}
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
