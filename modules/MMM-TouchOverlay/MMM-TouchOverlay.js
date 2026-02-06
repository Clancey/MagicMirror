/* MagicMirror Module: MMM-TouchOverlay
 * Provides touch-friendly overlay infrastructure for detail views
 */

Module.register("MMM-TouchOverlay", {
	defaults: {
		animationSpeed: 200,
		backdropOpacity: 0.8,
		closeButtonSize: 48,
		hideUITogglePosition: "bottom-right",
		calendarDaysToShow: 14,
		timeFormat: config.timeFormat, // Use global MagicMirror time format (12 or 24)
		units: config.units, // Use global MagicMirror units (metric, imperial, us)
		persistUIState: false, // Persist UI hidden state to localStorage
		autoHideDelay: 60, // Auto-hide UI after X seconds of inactivity (0 to disable)
		photoViewer: {
			showMetadata: true,
			slideshowPauseEnabled: true
		}
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

	// Inactivity tracking
	inactivityState: {
		lastActivity: Date.now(),
		timerId: null
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

	// Calendar detail state
	calendarData: {
		events: []
	},

	// Photo viewer state
	photoData: {
		currentImage: null,
		metadata: null,
		slideshowPaused: false
	},

	// Pending hide animation timeout (to cancel on rapid reopen)
	hideTimeoutId: null,

	getStyles: function () {
		return ["MMM-TouchOverlay.css"];
	},

	start: function () {
		Log.info("Starting module: " + this.name);
		this.startInactivityTimer();
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

		// Hide UI toggle button
		const uiToggleButton = document.createElement("button");
		uiToggleButton.className = "touch-ui-toggle";
		uiToggleButton.setAttribute("aria-label", "Hide interface");
		uiToggleButton.innerHTML = "<span class=\"toggle-icon\">👁</span>";
		uiToggleButton.addEventListener("click", () => this.toggleUI());
		this.applyTogglePosition(uiToggleButton, this.config.hideUITogglePosition);
		wrapper.appendChild(uiToggleButton);

		// Show UI button (visible only when UI is hidden)
		const uiShowButton = document.createElement("button");
		uiShowButton.className = "touch-ui-show";
		uiShowButton.setAttribute("aria-label", "Show interface");
		uiShowButton.innerHTML = "<span class=\"show-icon\">👁</span><span class=\"show-text\">UI</span>";
		uiShowButton.style.display = "none";
		uiShowButton.addEventListener("click", () => this.toggleUI());
		this.applyTogglePosition(uiShowButton, this.config.hideUITogglePosition);
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
				this.attachActivityListeners();
				this.restoreUIState();
				break;
			case "NEWS_FEED":
				this.newsItems = payload.items || [];
				this.newsData.items = payload.items || [];
				break;
			case "CALENDAR_EVENTS":
				this.calendarEvents = payload || [];
				this.calendarData.events = payload || [];
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
			newsfeed.addEventListener("click", (e) => {
				if (document.body.classList.contains("ui-hidden")) return;
				this.handleNewsfeedTap(e);
			});
		}

		// Weather module
		const weather = document.querySelector(".weather");
		if (weather) {
			weather.addEventListener("click", (e) => {
				if (document.body.classList.contains("ui-hidden")) return;
				this.handleWeatherTap(e);
			});
		}

		// Calendar module
		const calendar = document.querySelector(".calendar");
		if (calendar) {
			calendar.addEventListener("click", (e) => {
				if (document.body.classList.contains("ui-hidden")) return;
				this.handleCalendarTap(e);
			});
		}

		// Photo slideshow handlers
		this.attachPhotoHandlers();

		Log.info("MMM-TouchOverlay: Touch handlers attached");
	},

	attachPhotoHandlers: function () {
		// Handler function for both click and touch events
		const handlePhotoEvent = (e) => {
			if (this.overlayState.isOpen) return;

			const immichTile = e.target.closest(".immich-tile");
			if (immichTile) {
				const mediaElement = immichTile.querySelector("video.immich-tile-video") ||
					immichTile.querySelector(".immich-tile-img");
				if (mediaElement) {
					e.preventDefault();
					e.stopPropagation();
					this.handlePhotoTap(mediaElement);
				}
				return;
			}

			// Look for common slideshow image selectors
			const img = e.target.closest(
				".MMM-ImmichTileSlideShow img, " +
				"[class*='slideshow'] img, " +
				".background img, " +
				".fullscreen_below img, " +
				".fullscreen_above img"
			);

			if (img) {
				e.preventDefault();
				e.stopPropagation();
				this.handlePhotoTap(img);
			}
		};

		// Listen for both click and touchend events
		document.addEventListener("click", handlePhotoEvent);

		// Track touch start position to distinguish taps from swipes
		let touchStartX = 0;
		let touchStartY = 0;

		document.addEventListener("touchstart", (e) => {
			const touch = e.touches[0];
			touchStartX = touch.clientX;
			touchStartY = touch.clientY;
		}, { passive: true });

		document.addEventListener("touchend", (e) => {
			// Only handle as tap if touch didn't move much (not a swipe)
			const touch = e.changedTouches[0];
			const deltaX = Math.abs(touch.clientX - touchStartX);
			const deltaY = Math.abs(touch.clientY - touchStartY);

			if (deltaX < 10 && deltaY < 10) {
				// Create a synthetic event with the touch target
				const syntheticEvent = {
					target: e.target,
					preventDefault: () => e.preventDefault(),
					stopPropagation: () => e.stopPropagation()
				};
				handlePhotoEvent(syntheticEvent);
			}
		});
	},

	attachKeyboardHandler: function () {
		document.addEventListener("keydown", (e) => {
			if (e.key === "Escape" && this.overlayState.isOpen) {
				this.closeOverlay();
			}
			this.recordActivity();
		});
	},

	attachActivityListeners: function () {
		const events = ["touchstart", "click", "mousemove"];

		events.forEach(eventType => {
			document.addEventListener(eventType, () => {
				this.recordActivity();
			}, { passive: true });
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

		// Reset data-content attribute
		if (this.overlayElement) {
			this.overlayElement.removeAttribute("data-content");
		}

		// Resume slideshow if we were viewing a photo
		if (wasPhoto) {
			this.resumeSlideshow();
		}

		this.recordActivity();
	},

	showOverlay: function () {
		if (!this.overlayElement) return;

		// Cancel any pending hide animation to prevent race condition
		if (this.hideTimeoutId) {
			clearTimeout(this.hideTimeoutId);
			this.hideTimeoutId = null;
		}

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

		// Cancel any previous pending hide
		if (this.hideTimeoutId) {
			clearTimeout(this.hideTimeoutId);
		}

		this.overlayElement.classList.remove("visible");
		// Wait for animation to complete before hiding
		this.hideTimeoutId = setTimeout(() => {
			this.hideTimeoutId = null;
			// Only apply if overlay is still meant to be closed
			if (!this.overlayState.isOpen) {
				this.overlayElement.setAttribute("data-visible", "false");
				if (this.bodyElement) {
					this.bodyElement.innerHTML = "";
				}
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

	// Touch event handlers for opening detail views
	handleNewsfeedTap: function (e) {
		if (this.newsItems.length === 0) return;

		let tappedIndex = 0;

		// Check if tapped on a list item (showAsList mode)
		const listItem = e.target.closest(".newsfeed-list li");
		if (listItem) {
			const listItems = listItem.parentElement.querySelectorAll("li");
			tappedIndex = Array.from(listItems).indexOf(listItem);
		} else {
			// Single item mode - try to match displayed title to find index
			const titleEl = e.target.closest(".newsfeed")?.querySelector(".newsfeed-title");
			if (titleEl) {
				const displayedTitle = titleEl.textContent.trim();
				const matchedIndex = this.newsItems.findIndex(item =>
					item.title && item.title.trim() === displayedTitle
				);
				if (matchedIndex !== -1) {
					tappedIndex = matchedIndex;
				}
			}
		}

		// Ensure index is valid
		if (tappedIndex < 0 || tappedIndex >= this.newsItems.length) {
			tappedIndex = 0;
		}

		this.newsData.currentIndex = tappedIndex;
		this.openOverlay("news", this.newsData);
	},

	handleWeatherTap: function (e) {
		if (this.weatherData) {
			this.openOverlay("weather", this.weatherData);
		} else {
			this.openOverlay("weather", null);
		}
	},

	handleCalendarTap: function (e) {
		if (this.calendarEvents.length > 0) {
			this.openOverlay("calendar", this.calendarEvents);
		}
	},

	handlePhotoTap: function (imgElement) {
		const isVideo = imgElement.tagName === "VIDEO" || imgElement.classList.contains("immich-tile-video");
		const imageUrl = this.getImageUrlFromElement(imgElement);
		if (!imageUrl) return;

		const metadata = this.extractPhotoMetadata(imgElement);

		// Pause slideshow if enabled
		if (this.config.photoViewer?.slideshowPauseEnabled !== false) {
			this.pauseSlideshow();
		}

		if (isVideo) {
			// For videos, get the video URL and open video viewer
			const videoUrl = this.getVideoUrl(imgElement);
			this.photoData = {
				currentImage: imageUrl,
				currentVideo: videoUrl,
				isVideo: true,
				metadata: metadata,
				slideshowPaused: true
			};
			this.openOverlay("photo", this.photoData);
			return;
		}

		// For images, convert thumbnail URL to preview URL for larger size
		const previewUrl = this.convertToPreviewUrl(imageUrl);

		this.photoData = {
			currentImage: previewUrl,
			isVideo: false,
			metadata: metadata,
			slideshowPaused: true
		};

		// Preload the preview image before opening overlay
		this.preloadImage(previewUrl)
			.then(() => {
				this.openOverlay("photo", this.photoData);

				// Try to preload adjacent images for even smoother navigation
				this.preloadAdjacentImages(imgElement);
			})
			.catch((err) => {
				Log.error("MMM-TouchOverlay: Failed to preload image:", err);
				this.openOverlay("photo", this.photoData);
			});
	},

	convertToPreviewUrl: function (url) {
		if (!url) return url;
		// Convert /immichtilesslideshow/{id} to /immichtilesslideshow-preview/{id}
		if (url.includes("/immichtilesslideshow/")) {
			return url.replace("/immichtilesslideshow/", "/immichtilesslideshow-preview/");
		}
		return url;
	},

	getVideoUrl: function (element) {
		if (!element) return null;
		// For video elements, get the source URL
		if (element.tagName === "VIDEO") {
			return element.currentSrc || element.src || null;
		}
		// For immich tiles, construct video URL from image URL
		const tile = element.closest(".immich-tile");
		if (tile) {
			const video = tile.querySelector("video.immich-tile-video");
			if (video) {
				return video.currentSrc || video.src || null;
			}
		}
		return null;
	},

	extractPhotoMetadata: function (imgElement) {
		// Try to extract metadata from data attributes or parent elements
		const container = imgElement.closest("[data-photo-info]") ||
						  imgElement.closest("[data-date]") ||
						  imgElement.parentElement;

		return {
			date: imgElement.dataset.date || container?.dataset?.date || null,
			album: imgElement.dataset.album || container?.dataset?.album || null,
			filename: imgElement.alt || imgElement.dataset.filename ||
					  this.extractFilenameFromUrl(imgElement.src) || null
		};
	},

	extractFilenameFromUrl: function (url) {
		if (!url) return null;
		try {
			const pathname = new URL(url).pathname;
			return pathname.split("/").pop() || null;
		} catch (e) {
			return null;
		}
	},

	getImageUrlFromElement: function (element) {
		if (!element) return null;

		if (element.tagName === "IMG") {
			return element.src || element.dataset?.src || null;
		}

		if (element.tagName === "VIDEO") {
			return element.currentSrc || element.src || element.poster || null;
		}

		const backgroundUrl = this.extractBackgroundImageUrl(element);
		if (backgroundUrl) return backgroundUrl;

		return element.dataset?.src || null;
	},

	extractBackgroundImageUrl: function (element) {
		if (!element) return null;

		const style = typeof window !== "undefined" && window.getComputedStyle
			? window.getComputedStyle(element)
			: element.style;
		const backgroundImage = style?.backgroundImage || "";
		if (!backgroundImage || backgroundImage === "none") return null;

		const match = backgroundImage.match(/url\(["']?(.*?)["']?\)/);
		return match ? match[1] : null;
	},

	preloadImage: function (url) {
		if (!url) return Promise.reject(new Error("No URL provided"));

		return new Promise((resolve, reject) => {
			const img = new Image();

			img.onload = () => resolve(img);
			img.onerror = () => reject(new Error(`Failed to load image: ${url}`));

			img.src = url;
		});
	},

	preloadAdjacentImages: function (currentImgElement) {
		const parent = currentImgElement.parentElement;
		if (!parent) return;

		const images = Array.from(parent.querySelectorAll("img"));
		const currentIndex = images.indexOf(currentImgElement);

		if (currentIndex === -1) return;

		const nextIndex = currentIndex + 1;
		const prevIndex = currentIndex - 1;

		if (images[nextIndex]) {
			const nextUrl = images[nextIndex].src || images[nextIndex].dataset.src;
			if (nextUrl) {
				this.preloadImage(nextUrl).catch(() => {
				});
			}
		}

		if (images[prevIndex]) {
			const prevUrl = images[prevIndex].src || images[prevIndex].dataset.src;
			if (prevUrl) {
				this.preloadImage(prevUrl).catch(() => {
				});
			}
		}
	},

	pauseSlideshow: function () {
		if (this.photoData.slideshowPaused) return;

		// Send common slideshow pause notifications
		this.sendNotification("SLIDESHOW_PAUSE", {});
		this.sendNotification("REMOTE_ACTION", { action: "PAUSE" });

		this.photoData.slideshowPaused = true;
		Log.info("MMM-TouchOverlay: Requested slideshow pause");
	},

	resumeSlideshow: function () {
		if (!this.photoData.slideshowPaused) return;

		// Send common slideshow resume notifications
		this.sendNotification("SLIDESHOW_RESUME", {});
		this.sendNotification("REMOTE_ACTION", { action: "PLAY" });

		this.photoData.slideshowPaused = false;
		Log.info("MMM-TouchOverlay: Requested slideshow resume");
	},

	// Detail view rendering methods
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

	// Weather detail methods
	getWeatherIcon: function (weatherType) {
		// Use Weather Icons font classes to match the weather module's style
		// Returns HTML span with wi-{weatherType} class
		if (!weatherType) {
			return `<span class="wi wi-na"></span>`;
		}
		return `<span class="wi wi-${weatherType}"></span>`;
	},

	formatTemp: function (temp) {
		return Math.round(temp);
	},

	formatWind: function (speed) {
		return Math.round(speed);
	},

	getWindUnit: function () {
		// Wind units based on config.units (matches weather module behavior)
		// imperial/us = mph, metric = m/s
		if (this.config.units === "imperial" || this.config.units === "us") {
			return "mph";
		}
		return "m/s";
	},

	renderWeatherDetail: function () {
		if (!this.weatherData) {
			this.bodyElement.innerHTML = `
				<div class="weather-loading">
					<div class="weather-loading-spinner"></div>
					<p class="weather-loading-text">Loading weather data...</p>
				</div>
			`;
			return;
		}

		if (!this.weatherData.currentWeather) {
			this.bodyElement.innerHTML = "<p>No weather data available</p>";
			return;
		}

		const current = this.weatherData.currentWeather;
		const hourly = this.weatherData.hourlyArray || [];
		const forecast = this.weatherData.forecastArray || [];
		const location = this.weatherData.locationName || "Unknown Location";

		const formatTime = (date) => {
			const d = new Date(date);
			// Respect timeFormat setting (12 or 24 hour)
			if (this.config.timeFormat === 12) {
				return d.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
			}
			return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
		};

		const formatDayName = (date) => {
			const d = new Date(date);
			return d.toLocaleDateString("en-US", { weekday: "short" });
		};

		const windUnit = this.getWindUnit();

		let html = `
			<div class="weather-detail">
				<div class="weather-location">${location}</div>

				<section class="weather-current">
					<div class="weather-current-main">
						<span class="weather-icon">${this.getWeatherIcon(current.weatherType)}</span>
						<span class="weather-temp-large">${this.formatTemp(current.temperature)}°</span>
					</div>
					<div class="weather-current-desc">${current.weatherType || "Unknown"}</div>
					<div class="weather-current-details">
						<div class="weather-detail-item">
							<span class="label">Feels like</span>
							<span class="value">${this.formatTemp(current.feelsLike)}°</span>
						</div>
						<div class="weather-detail-item">
							<span class="label">Humidity</span>
							<span class="value">${current.humidity || 0}%</span>
						</div>
						<div class="weather-detail-item">
							<span class="label">Wind</span>
							<span class="value">${this.formatWind(current.windSpeed)} ${windUnit}</span>
						</div>
						${current.uvIndex != null ? `
						<div class="weather-detail-item">
							<span class="label">UV Index</span>
							<span class="value">${current.uvIndex}</span>
						</div>` : ""}
						${current.precipitationProbability != null ? `
						<div class="weather-detail-item">
							<span class="label">Precip</span>
							<span class="value">${current.precipitationProbability}%</span>
						</div>` : ""}
					</div>
				</section>
		`;

		if (hourly.length > 0) {
			html += `
				<section class="weather-hourly">
					<h2 class="weather-section-title">Hourly</h2>
					<div class="weather-hourly-scroll">
			`;

			hourly.slice(0, 12).forEach(hour => {
				html += `
					<div class="weather-hour">
						<span class="hour-time">${formatTime(hour.date)}</span>
						<span class="hour-icon">${this.getWeatherIcon(hour.weatherType)}</span>
						<span class="hour-temp">${this.formatTemp(hour.temperature)}°</span>
					</div>
				`;
			});

			html += `
					</div>
				</section>
			`;
		}

		if (forecast.length > 0) {
			html += `
				<section class="weather-forecast">
					<h2 class="weather-section-title">7-Day Forecast</h2>
					<div class="weather-forecast-list">
			`;

			forecast.slice(0, 7).forEach(day => {
				const precipHtml = day.precipitationProbability != null ?
					`<span class="day-precip">${day.precipitationProbability}%</span>` : "";

				html += `
					<div class="weather-day">
						<span class="day-name">${formatDayName(day.date)}</span>
						<span class="day-icon">${this.getWeatherIcon(day.weatherType)}</span>
						<span class="day-high">${this.formatTemp(day.maxTemperature)}°</span>
						<span class="day-low">${this.formatTemp(day.minTemperature)}°</span>
						${precipHtml}
					</div>
				`;
			});

			html += `
					</div>
				</section>
			`;
		}

		html += `</div>`;
		this.bodyElement.innerHTML = html;
	},

	// Calendar detail methods
	formatEvent: function (event) {
		const now = new Date();
		const start = new Date(event.startDate);
		const end = new Date(event.endDate);

		const timeFormat = (date) => {
			const hours = date.getHours();
			const minutes = date.getMinutes().toString().padStart(2, "0");

			// Use 12h or 24h format based on config
			if (this.config.timeFormat === 12) {
				const hour12 = hours % 12 || 12;
				const period = hours < 12 ? "AM" : "PM";
				return `${hour12}:${minutes} ${period}`;
			}
			// 24-hour format
			return `${hours.toString().padStart(2, "0")}:${minutes}`;
		};

		return {
			title: event.title || "Untitled Event",
			startTime: event.fullDayEvent ? null : timeFormat(start),
			endTime: event.fullDayEvent ? null : timeFormat(end),
			fullDayEvent: event.fullDayEvent || false,
			location: event.location || null,
			color: event.color || null,
			calendarName: event.calendarName || null,
			isPast: end < now
		};
	},

	groupEventsByDate: function (events, daysToShow) {
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		const endDate = new Date(now);
		endDate.setDate(endDate.getDate() + daysToShow);
		endDate.setHours(23, 59, 59, 999);

		const filteredEvents = events
			.filter(e => new Date(e.endDate) > now && new Date(e.startDate) <= endDate)
			.sort((a, b) => a.startDate - b.startDate);

		const groups = {};
		filteredEvents.forEach(event => {
			const eventDate = new Date(event.startDate);
			eventDate.setHours(0, 0, 0, 0);
			const dateKey = eventDate.toISOString().split("T")[0];
			if (!groups[dateKey]) {
				groups[dateKey] = [];
			}
			groups[dateKey].push(event);
		});

		return Object.keys(groups).sort().map(dateKey => {
			// Parse dateKey (YYYY-MM-DD) as local date, not UTC
			const [year, month, day] = dateKey.split("-").map(Number);
			const date = new Date(year, month - 1, day);

			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const tomorrow = new Date(today);
			tomorrow.setDate(tomorrow.getDate() + 1);

			const isToday = date.getTime() === today.getTime();
			const isTomorrow = date.getTime() === tomorrow.getTime();
			const isThisWeek = date < new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

			let dateLabel;
			let headerClass = "";

			if (isToday) {
				dateLabel = "Today";
				headerClass = "today";
			} else if (isTomorrow) {
				dateLabel = "Tomorrow";
				headerClass = "tomorrow";
			} else if (isThisWeek) {
				dateLabel = date.toLocaleDateString("en-US", { weekday: "long" });
			} else {
				dateLabel = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
			}

			return {
				dateKey,
				dateLabel,
				headerClass,
				events: groups[dateKey].map(e => this.formatEvent(e))
			};
		});
	},

	renderCalendarDetail: function () {
		const eventsByDate = this.groupEventsByDate(
			this.calendarData.events,
			this.config.calendarDaysToShow
		);

		if (eventsByDate.length === 0) {
			this.bodyElement.innerHTML = `
				<div class="calendar-detail">
					<h1 class="calendar-title">Upcoming Events</h1>
					<div class="calendar-empty">No upcoming events</div>
				</div>
			`;
			return;
		}

		let html = `
			<div class="calendar-detail">
				<h1 class="calendar-title">Upcoming Events</h1>
		`;

		eventsByDate.forEach(dateGroup => {
			html += `
				<section class="calendar-day">
					<h2 class="calendar-date-header ${dateGroup.headerClass}">
						${dateGroup.dateLabel}
					</h2>
					<div class="calendar-events">
			`;

			dateGroup.events.forEach(event => {
				const colorStyle = event.color ? `border-left-color: ${event.color}` : "";
				const allDayClass = event.fullDayEvent ? "all-day" : "";
				const pastClass = event.isPast ? "past" : "";

				let timeHtml = "";
				if (event.fullDayEvent) {
					timeHtml = `<span class="all-day-badge">All Day</span>`;
				} else {
					timeHtml = `<span class="event-start">${event.startTime}</span>`;
					if (event.endTime) {
						timeHtml += `<span class="event-separator">-</span><span class="event-end">${event.endTime}</span>`;
					}
				}

				let detailsHtml = `<div class="event-title">${event.title}</div>`;
				if (event.location) {
					detailsHtml += `
						<div class="event-location">
							<span class="location-icon">📍</span>
							${event.location}
						</div>`;
				}
				if (event.calendarName) {
					detailsHtml += `<div class="event-calendar">${event.calendarName}</div>`;
				}

				html += `
					<div class="calendar-event ${allDayClass} ${pastClass}" style="${colorStyle}">
						<div class="event-time">${timeHtml}</div>
						<div class="event-details">${detailsHtml}</div>
					</div>
				`;
			});

			html += `
					</div>
				</section>
			`;
		});

		html += `</div>`;
		this.bodyElement.innerHTML = html;
	},

	renderPhotoViewer: function () {
		if (!this.photoData.currentImage && !this.photoData.currentVideo) {
			this.bodyElement.innerHTML = "<p>No photo available</p>";
			return;
		}

		const showMetadata = this.config.photoViewer?.showMetadata !== false;
		const metadata = this.photoData.metadata;
		const hasMetadata = showMetadata && metadata &&
						   (metadata.date || metadata.album || metadata.filename);

		let metadataHtml = "";
		if (hasMetadata) {
			metadataHtml = `
				<div class="photo-metadata">
					${metadata.date ? `<span class="photo-date">${metadata.date}</span>` : ""}
					${metadata.album ? `<span class="photo-album">${metadata.album}</span>` : ""}
					${metadata.filename ? `<span class="photo-filename">${metadata.filename}</span>` : ""}
				</div>
			`;
		}

		let mediaHtml;
		if (this.photoData.isVideo && this.photoData.currentVideo) {
			// Render video with audio controls
			mediaHtml = `
				<video
					class="photo-viewer-video"
					src="${this.photoData.currentVideo}"
					poster="${this.photoData.currentImage || ""}"
					controls
					autoplay
					loop
					playsinline
				></video>
			`;
		} else {
			// Render image
			mediaHtml = `
				<img
					class="photo-viewer-image"
					src="${this.photoData.currentImage}"
					alt="${metadata?.filename || "Photo"}"
				/>
			`;
		}

		this.bodyElement.innerHTML = `
			<div class="photo-viewer">
				${mediaHtml}
				${metadataHtml}
			</div>
		`;

		this.attachPhotoSwipeHandlers();

		// Set data attribute on overlay for photo-specific styling
		if (this.overlayElement) {
			this.overlayElement.setAttribute("data-content", "photo");
		}
	},

	attachPhotoSwipeHandlers: function () {
		this.attachSwipeHandlers(this.bodyElement, (direction) => {
			this.navigatePhoto(direction);
		});
	},

	navigatePhoto: function (direction) {
		const allImages = document.querySelectorAll(".slideshow img, .photo img");
		if (allImages.length === 0) return;

		let currentIndex = -1;
		for (let i = 0; i < allImages.length; i++) {
			const src = allImages[i].src || allImages[i].dataset.src;
			if (src === this.photoData.currentImage) {
				currentIndex = i;
				break;
			}
		}

		if (currentIndex === -1) return;

		let newIndex = currentIndex + direction;
		if (direction === "left") {
			newIndex = currentIndex + 1;
		} else if (direction === "right") {
			newIndex = currentIndex - 1;
		}

		if (newIndex >= 0 && newIndex < allImages.length) {
			const nextImgElement = allImages[newIndex];
			const nextImageUrl = nextImgElement.src || nextImgElement.dataset.src;

			if (nextImageUrl) {
				this.preloadImage(nextImageUrl)
					.then(() => {
						const metadata = this.extractPhotoMetadata(nextImgElement);
						this.photoData.currentImage = nextImageUrl;
						this.photoData.metadata = metadata;
						this.renderPhotoViewer();
					})
					.catch((err) => {
						Log.error("MMM-TouchOverlay: Failed to navigate to next photo:", err);
					});
			}
		}
	},

	// UI Toggle Methods
	applyTogglePosition: function (button, position) {
		const positions = {
			"top-left": { top: "24px", left: "24px", right: "auto", bottom: "auto" },
			"top-right": { top: "24px", right: "24px", left: "auto", bottom: "auto" },
			"bottom-left": { bottom: "24px", left: "24px", right: "auto", top: "auto" },
			"bottom-right": { bottom: "24px", right: "24px", left: "auto", top: "auto" }
		};
		const pos = positions[position] || positions["bottom-right"];
		Object.assign(button.style, pos);
	},

	toggleUI: function () {
		this.uiState.hidden = !this.uiState.hidden;

		if (this.uiState.hidden) {
			this.hideUI();
		} else {
			this.showUI();
			this.recordActivity();
		}

		// Persist state to localStorage if enabled
		if (this.config.persistUIState) {
			this.saveUIState();
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

	saveUIState: function () {
		try {
			localStorage.setItem("mm-touch-ui-hidden", this.uiState.hidden ? "true" : "false");
		} catch (e) {
			Log.warn("MMM-TouchOverlay: Could not save UI state to localStorage", e);
		}
	},

	restoreUIState: function () {
		if (!this.config.persistUIState) return;

		try {
			const savedState = localStorage.getItem("mm-touch-ui-hidden");
			if (savedState === "true") {
				this.uiState.hidden = true;
				this.hideUI();
			}
		} catch (e) {
			Log.warn("MMM-TouchOverlay: Could not restore UI state from localStorage", e);
		}
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

	startInactivityTimer: function () {
		if (this.config.autoHideDelay <= 0) return;

		this.stopInactivityTimer();
		this.inactivityState.lastActivity = Date.now();

		this.inactivityState.timerId = setInterval(() => {
			const elapsed = (Date.now() - this.inactivityState.lastActivity) / 1000;
			if (elapsed >= this.config.autoHideDelay && !this.uiState.hidden) {
				this.toggleUI();
			}
		}, 1000);
	},

	stopInactivityTimer: function () {
		if (this.inactivityState.timerId) {
			clearInterval(this.inactivityState.timerId);
			this.inactivityState.timerId = null;
		}
	},

	recordActivity: function () {
		this.inactivityState.lastActivity = Date.now();
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

		this.attachSwipeHandlers(this.bodyElement, (direction) => {
			if (direction === "left" && nextBtn && !nextBtn.disabled) {
				this.navigateNews(1);
			} else if (direction === "right" && prevBtn && !prevBtn.disabled) {
				this.navigateNews(-1);
			}
		});
	},

	attachSwipeHandlers: function (element, callback) {
		let touchStartX = 0;
		let touchEndX = 0;
		const minSwipeDistance = 50;

		element.addEventListener("touchstart", (e) => {
			touchStartX = e.changedTouches[0].screenX;
		}, { passive: true });

		element.addEventListener("touchend", (e) => {
			touchEndX = e.changedTouches[0].screenX;
			this.handleSwipe(touchStartX, touchEndX, minSwipeDistance, callback);
		}, { passive: true });
	},

	handleSwipe: function (startX, endX, minDistance, callback) {
		const diffX = endX - startX;

		if (Math.abs(diffX) < minDistance) return;

		if (diffX > 0) {
			callback("right");
		} else {
			callback("left");
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
