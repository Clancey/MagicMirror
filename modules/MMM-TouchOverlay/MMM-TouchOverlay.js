/* MagicMirror Module: MMM-TouchOverlay
 * Provides touch-friendly overlay infrastructure for detail views
 */

Module.register("MMM-TouchOverlay", {
	defaults: {
		animationSpeed: 200,
		backdropOpacity: 0.8,
		closeButtonSize: 48
	},

	// Internal state
	overlayState: {
		isOpen: false,
		contentType: null, // 'news' | 'weather' | 'calendar' | 'photo'
		data: null
	},

	// Data storage for module content
	newsItems: [],
	calendarEvents: [],
	weatherData: null,

	getStyles: function () {
		return ["MMM-TouchOverlay.css"];
	},

	start: function () {
		Log.info("Starting module: " + this.name);
	},

	getDom: function () {
		const wrapper = document.createElement("div");
		wrapper.className = "touch-overlay-wrapper";

		// Create overlay container
		const overlay = document.createElement("div");
		overlay.className = "touch-overlay";
		overlay.setAttribute("data-visible", "false");

		// Backdrop
		const backdrop = document.createElement("div");
		backdrop.className = "touch-overlay-backdrop";
		backdrop.style.background = `rgba(0, 0, 0, ${this.config.backdropOpacity})`;
		backdrop.addEventListener("click", () => this.closeOverlay());

		// Content container
		const content = document.createElement("div");
		content.className = "touch-overlay-content";

		// Close button
		const closeBtn = document.createElement("button");
		closeBtn.className = "touch-overlay-close";
		closeBtn.setAttribute("aria-label", "Close");
		closeBtn.style.width = `${this.config.closeButtonSize}px`;
		closeBtn.style.height = `${this.config.closeButtonSize}px`;
		closeBtn.innerHTML = "&times;";
		closeBtn.addEventListener("click", () => this.closeOverlay());

		// Body for dynamic content
		const body = document.createElement("div");
		body.className = "touch-overlay-body";

		content.appendChild(closeBtn);
		content.appendChild(body);
		overlay.appendChild(backdrop);
		overlay.appendChild(content);
		wrapper.appendChild(overlay);

		// Hide UI toggle button (logic wired in later tasks)
		const uiToggleButton = document.createElement("button");
		uiToggleButton.className = "touch-ui-toggle";
		uiToggleButton.setAttribute("aria-label", "Hide interface");
		uiToggleButton.style.width = "48px";
		uiToggleButton.style.height = "48px";
		uiToggleButton.innerHTML = "<span class=\"toggle-icon\">👁</span>";
		uiToggleButton.addEventListener("click", () => this.toggleUI());
		wrapper.appendChild(uiToggleButton);

		// Store reference for later updates
		this.overlayElement = overlay;
		this.bodyElement = body;
		this.uiToggleButton = uiToggleButton;

		return wrapper;
	},

	notificationReceived: function (notification, payload, sender) {
		switch (notification) {
			case "MODULE_DOM_CREATED":
				this.attachTouchHandlers();
				this.attachKeyboardHandler();
				break;
			case "NEWS_FEED":
				this.newsItems = payload.items || [];
				break;
			case "CALENDAR_EVENTS":
				this.calendarEvents = payload || [];
				break;
			case "WEATHER_UPDATED":
				this.weatherData = payload;
				break;
		}
	},

	attachTouchHandlers: function () {
		// Newsfeed module
		const newsfeed = document.querySelector(".newsfeed");
		if (newsfeed) {
			newsfeed.addEventListener("click", (e) => this.handleNewsfeedTap(e));
		}

		// Weather module
		const weather = document.querySelector(".weather");
		if (weather) {
			weather.addEventListener("click", (e) => this.handleWeatherTap(e));
		}

		// Calendar module
		const calendar = document.querySelector(".calendar");
		if (calendar) {
			calendar.addEventListener("click", (e) => this.handleCalendarTap(e));
		}

		Log.info("MMM-TouchOverlay: Touch handlers attached");
	},

	attachKeyboardHandler: function () {
		document.addEventListener("keydown", (e) => {
			if (e.key === "Escape" && this.overlayState.isOpen) {
				this.closeOverlay();
			}
		});
	},

	openOverlay: function (contentType, data) {
		if (this.overlayState.isOpen) return;

		this.overlayState = {
			isOpen: true,
			contentType: contentType,
			data: data
		};

		this.renderContent();
		this.showOverlay();
		this.sendNotification("TOUCH_OVERLAY_OPEN", { type: contentType, data: data });
	},

	closeOverlay: function () {
		if (!this.overlayState.isOpen) return;

		const wasPhoto = this.overlayState.contentType === "photo";

		this.overlayState = {
			isOpen: false,
			contentType: null,
			data: null
		};

		this.hideOverlay();
		this.sendNotification("TOUCH_OVERLAY_CLOSE", {});

		// Resume slideshow if we were viewing a photo
		if (wasPhoto) {
			this.sendNotification("SLIDESHOW_RESUME", {});
		}
	},

	showOverlay: function () {
		if (!this.overlayElement) return;

		this.overlayElement.setAttribute("data-visible", "true");
		// Trigger reflow for animation
		this.overlayElement.offsetHeight;
		// Add visible class after a frame for animation
		requestAnimationFrame(() => {
			this.overlayElement.classList.add("visible");
		});
	},

	hideOverlay: function () {
		if (!this.overlayElement) return;

		this.overlayElement.classList.remove("visible");
		// Wait for animation to complete before hiding
		setTimeout(() => {
			this.overlayElement.setAttribute("data-visible", "false");
			if (this.bodyElement) {
				this.bodyElement.innerHTML = "";
			}
		}, this.config.animationSpeed);
	},

	renderContent: function () {
		if (!this.bodyElement) return;

		switch (this.overlayState.contentType) {
			case "news":
				this.renderNewsDetail();
				break;
			case "weather":
				this.renderWeatherDetail();
				break;
			case "calendar":
				this.renderCalendarDetail();
				break;
			case "photo":
				this.renderPhotoViewer();
				break;
			default:
				this.bodyElement.innerHTML = "<p>Unknown content type</p>";
		}
	},

	// Placeholder handlers - to be implemented in detail view tasks
	handleNewsfeedTap: function (e) {
		if (this.newsItems.length > 0) {
			this.openOverlay("news", { items: this.newsItems, currentIndex: 0 });
		}
	},

	handleWeatherTap: function (e) {
		if (this.weatherData) {
			this.openOverlay("weather", this.weatherData);
		}
	},

	handleCalendarTap: function (e) {
		if (this.calendarEvents.length > 0) {
			this.openOverlay("calendar", this.calendarEvents);
		}
	},

	// Placeholder render methods - to be implemented in detail view tasks
	renderNewsDetail: function () {
		this.bodyElement.innerHTML = "<p>News detail view - to be implemented</p>";
	},

	renderWeatherDetail: function () {
		this.bodyElement.innerHTML = "<p>Weather detail view - to be implemented</p>";
	},

	renderCalendarDetail: function () {
		this.bodyElement.innerHTML = "<p>Calendar detail view - to be implemented</p>";
	},

	renderPhotoViewer: function () {
		this.bodyElement.innerHTML = "<p>Photo viewer - to be implemented</p>";
	}
});
