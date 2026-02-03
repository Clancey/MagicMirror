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

	// UI visibility state
	uiState: {
		hidden: false
	},

	// Data storage for module content
	newsItems: [],
	calendarEvents: [],
	weatherData: null,

	// News detail state
	newsData: {
		items: [],
		currentIndex: 0
	},

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

		// Show UI button (visible only when UI is hidden)
		const uiShowButton = document.createElement("button");
		uiShowButton.className = "touch-ui-show";
		uiShowButton.setAttribute("aria-label", "Show interface");
		uiShowButton.innerHTML = "<span class=\"show-icon\">👁</span><span class=\"show-text\">UI</span>";
		uiShowButton.style.display = "none";
		uiShowButton.addEventListener("click", () => this.toggleUI());
		wrapper.appendChild(uiShowButton);

		// Store reference for later updates
		this.overlayElement = overlay;
		this.bodyElement = body;
		this.uiToggleButton = uiToggleButton;
		this.uiShowButton = uiShowButton;

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
				this.newsData.items = payload.items || [];
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
			this.newsData.currentIndex = 0;
			this.openOverlay("news", this.newsData);
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
		if (this.newsData.items.length === 0) {
			this.bodyElement.innerHTML = "<p>No news items available</p>";
			return;
		}

		const item = this.newsData.items[this.newsData.currentIndex];
		if (!item) {
			this.bodyElement.innerHTML = "<p>Article not found</p>";
			return;
		}

		const formatDate = (dateString) => {
			if (!dateString) return "";
			const date = new Date(dateString);
			const now = new Date();
			const diffMs = now - date;
			const diffMins = Math.floor(diffMs / 60000);
			const diffHours = Math.floor(diffMs / 3600000);
			const diffDays = Math.floor(diffMs / 86400000);

			if (diffMins < 60) return `${diffMins}m ago`;
			if (diffHours < 24) return `${diffHours}h ago`;
			if (diffDays < 7) return `${diffDays}d ago`;
			return date.toLocaleDateString();
		};

		this.bodyElement.innerHTML = `
			<div class="news-detail">
				<div class="news-detail-header">
					<span class="news-source">${item.sourceTitle || "Unknown"}</span>
					<span class="news-date">${formatDate(item.pubdate)}</span>
				</div>

				<h1 class="news-headline">${item.title || "No title"}</h1>

				${item.description ? `<div class="news-summary">${item.description}</div>` : ""}

				${item.url ? `
				<div class="news-link-indicator">
					<span class="news-link-icon">🔗</span>
					<span class="news-link-text">${item.url.length > 50 ? item.url.substring(0, 50) + "..." : item.url}</span>
				</div>` : ""}

				<div class="news-navigation">
					<button class="news-nav-btn news-prev" aria-label="Previous article" ${this.newsData.currentIndex === 0 ? "disabled" : ""}>‹</button>
					<span class="news-position">${this.newsData.currentIndex + 1} / ${this.newsData.items.length}</span>
					<button class="news-nav-btn news-next" aria-label="Next article" ${this.newsData.currentIndex >= this.newsData.items.length - 1 ? "disabled" : ""}>›</button>
				</div>
			</div>
		`;

		this.attachNewsNavigationHandlers();
	},

	renderWeatherDetail: function () {
		this.bodyElement.innerHTML = "<p>Weather detail view - to be implemented</p>";
	},

	renderCalendarDetail: function () {
		this.bodyElement.innerHTML = "<p>Calendar detail view - to be implemented</p>";
	},

	renderPhotoViewer: function () {
		this.bodyElement.innerHTML = "<p>Photo viewer - to be implemented</p>";
	},

	// UI Toggle Methods
	toggleUI: function () {
		this.uiState.hidden = !this.uiState.hidden;

		if (this.uiState.hidden) {
			this.hideUI();
		} else {
			this.showUI();
		}

		this.sendNotification("TOUCH_UI_HIDDEN", { hidden: this.uiState.hidden });
	},

	hideUI: function () {
		document.body.classList.add("ui-hidden");
		this.updateToggleVisibility();
	},

	showUI: function () {
		document.body.classList.remove("ui-hidden");
		this.updateToggleVisibility();
	},

	updateToggleVisibility: function () {
		if (this.uiToggleButton && this.uiShowButton) {
			if (this.uiState.hidden) {
				this.uiToggleButton.style.display = "none";
				this.uiShowButton.style.display = "flex";
			} else {
				this.uiToggleButton.style.display = "flex";
				this.uiShowButton.style.display = "none";
			}
		}
	},

	// News navigation methods
	attachNewsNavigationHandlers: function () {
		const prevBtn = this.bodyElement.querySelector(".news-prev");
		const nextBtn = this.bodyElement.querySelector(".news-next");

		if (prevBtn && !prevBtn.disabled) {
			prevBtn.addEventListener("click", () => this.navigateNews(-1));
		}

		if (nextBtn && !nextBtn.disabled) {
			nextBtn.addEventListener("click", () => this.navigateNews(1));
		}
	},

	navigateNews: function (direction) {
		const newIndex = this.newsData.currentIndex + direction;
		if (newIndex >= 0 && newIndex < this.newsData.items.length) {
			this.newsData.currentIndex = newIndex;
			this.renderNewsDetail();
		}
	}
});
