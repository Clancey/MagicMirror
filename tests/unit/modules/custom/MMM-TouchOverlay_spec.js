/**
 * Unit tests for MMM-TouchOverlay module
 * Tests core flows: formatEvent, groupEventsByDate, getWeatherIcon, getWindUnit
 */

// Mock the global Module object for testing
const mockConfig = {
	timeFormat: 12,
	units: "imperial"
};

global.config = mockConfig;

global.Module = {
	register (name, obj) {
		this._registered = { name, obj };
	}
};

global.Log = {
	info: () => {},
	warn: () => {},
	error: () => {},
	debug: () => {}
};

// Load the module
require("../../../../modules/MMM-TouchOverlay/MMM-TouchOverlay");

// Get the registered module object
const touchOverlay = Module._registered.obj;

// Apply defaults to config for testing
touchOverlay.config = {
	...touchOverlay.defaults,
	timeFormat: 12,
	units: "imperial",
	calendarDaysToShow: 14
};

describe("MMM-TouchOverlay unit tests", () => {
	describe("formatEvent", () => {
		it("should format a regular event with times", () => {
			const event = {
				title: "Test Meeting",
				startDate: new Date("2026-02-03T14:30:00").getTime(),
				endDate: new Date("2026-02-03T15:30:00").getTime(),
				fullDayEvent: false,
				location: "Conference Room A",
				color: "#3174ad",
				calendarName: "Work"
			};

			const result = touchOverlay.formatEvent(event);

			expect(result.title).toBe("Test Meeting");
			expect(result.location).toBe("Conference Room A");
			expect(result.color).toBe("#3174ad");
			expect(result.calendarName).toBe("Work");
			expect(result.fullDayEvent).toBe(false);
			expect(result.startTime).toBeTruthy();
			expect(result.endTime).toBeTruthy();
		});

		it("should handle full-day events", () => {
			const event = {
				title: "All Day Conference",
				startDate: new Date("2026-02-03T00:00:00").getTime(),
				endDate: new Date("2026-02-04T00:00:00").getTime(),
				fullDayEvent: true
			};

			const result = touchOverlay.formatEvent(event);

			expect(result.fullDayEvent).toBe(true);
			expect(result.startTime).toBeNull();
			expect(result.endTime).toBeNull();
		});

		it("should format times in 12-hour format when config is 12", () => {
			touchOverlay.config.timeFormat = 12;
			const event = {
				title: "Test",
				startDate: new Date("2026-02-03T14:30:00").getTime(),
				endDate: new Date("2026-02-03T15:30:00").getTime(),
				fullDayEvent: false
			};

			const result = touchOverlay.formatEvent(event);

			expect(result.startTime).toMatch(/^(1?\d):(\d{2}) (AM|PM)$/);
		});

		it("should format times in 24-hour format when config is 24", () => {
			touchOverlay.config.timeFormat = 24;
			const event = {
				title: "Test",
				startDate: new Date("2026-02-03T14:30:00").getTime(),
				endDate: new Date("2026-02-03T15:30:00").getTime(),
				fullDayEvent: false
			};

			const result = touchOverlay.formatEvent(event);

			expect(result.startTime).toMatch(/^\d{2}:\d{2}$/);

			// Reset for other tests
			touchOverlay.config.timeFormat = 12;
		});

		it("should handle missing optional fields", () => {
			const event = {
				startDate: new Date("2026-02-03T14:30:00").getTime(),
				endDate: new Date("2026-02-03T15:30:00").getTime()
			};

			const result = touchOverlay.formatEvent(event);

			expect(result.title).toBe("Untitled Event");
			expect(result.location).toBeNull();
			expect(result.color).toBeNull();
			expect(result.calendarName).toBeNull();
		});

		it("should mark past events as isPast", () => {
			const pastEvent = {
				title: "Past Event",
				startDate: new Date("2020-01-01T10:00:00").getTime(),
				endDate: new Date("2020-01-01T11:00:00").getTime(),
				fullDayEvent: false
			};

			const result = touchOverlay.formatEvent(pastEvent);

			expect(result.isPast).toBe(true);
		});
	});

	describe("groupEventsByDate", () => {
		const now = new Date();
		const today = new Date(now);
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);
		const nextWeek = new Date(today);
		nextWeek.setDate(nextWeek.getDate() + 7);

		it("should group events by date", () => {
			const events = [
				{
					title: "Tomorrow Event",
					startDate: tomorrow.getTime() + 36000000, // 10 AM tomorrow
					endDate: tomorrow.getTime() + 39600000,
					fullDayEvent: false
				}
			];

			const result = touchOverlay.groupEventsByDate(events, 14);

			expect(result.length).toBeGreaterThanOrEqual(1);
		});

		it("should label tomorrow correctly with headerClass", () => {
			// Only test tomorrow since "today" depends on current time of day
			const events = [
				{
					title: "Tomorrow Event",
					startDate: tomorrow.getTime() + 36000000,
					endDate: tomorrow.getTime() + 72000000,
					fullDayEvent: false
				}
			];

			const result = touchOverlay.groupEventsByDate(events, 14);

			// Result should have at least one group
			expect(result.length).toBeGreaterThan(0);

			// The first group should be for tomorrow
			const firstGroup = result[0];
			expect(firstGroup.dateLabel).toBe("Tomorrow");
			expect(firstGroup.headerClass).toBe("tomorrow");
		});

		it("should filter events outside daysToShow range", () => {
			const farFutureDate = new Date(today);
			farFutureDate.setDate(farFutureDate.getDate() + 30);

			const events = [
				{
					title: "Far Future Event",
					startDate: farFutureDate.getTime(),
					endDate: farFutureDate.getTime() + 3600000,
					fullDayEvent: false
				}
			];

			const result = touchOverlay.groupEventsByDate(events, 7);

			expect(result).toHaveLength(0);
		});

		it("should return empty array for no events", () => {
			const result = touchOverlay.groupEventsByDate([], 14);

			expect(result).toEqual([]);
		});
	});

	describe("getWeatherIcon", () => {
		it("should return Weather Icons span for known weather types", () => {
			const result = touchOverlay.getWeatherIcon("day-sunny");

			expect(result).toBe("<span class=\"wi wi-day-sunny\"></span>");
		});

		it("should return Weather Icons span for cloudy", () => {
			const result = touchOverlay.getWeatherIcon("cloudy");

			expect(result).toBe("<span class=\"wi wi-cloudy\"></span>");
		});

		it("should return na icon for null/undefined weather type", () => {
			expect(touchOverlay.getWeatherIcon(null)).toBe("<span class=\"wi wi-na\"></span>");
			expect(touchOverlay.getWeatherIcon(undefined)).toBe("<span class=\"wi wi-na\"></span>");
		});
	});

	describe("getWindUnit", () => {
		it("should return mph for imperial units", () => {
			touchOverlay.config.units = "imperial";
			expect(touchOverlay.getWindUnit()).toBe("mph");
		});

		it("should return mph for us units", () => {
			touchOverlay.config.units = "us";
			expect(touchOverlay.getWindUnit()).toBe("mph");
		});

		it("should return m/s for metric units", () => {
			touchOverlay.config.units = "metric";
			expect(touchOverlay.getWindUnit()).toBe("m/s");
		});
	});

	describe("formatTemp", () => {
		it("should round temperature to nearest integer", () => {
			expect(touchOverlay.formatTemp(72.4)).toBe(72);
			expect(touchOverlay.formatTemp(72.6)).toBe(73);
			expect(touchOverlay.formatTemp(-5.3)).toBe(-5);
		});
	});

	describe("formatWind", () => {
		it("should round wind speed to nearest integer", () => {
			expect(touchOverlay.formatWind(12.4)).toBe(12);
			expect(touchOverlay.formatWind(12.6)).toBe(13);
		});
	});

	describe("extractFilenameFromUrl", () => {
		it("should extract filename from URL", () => {
			const result = touchOverlay.extractFilenameFromUrl("https://example.com/images/photo.jpg");

			expect(result).toBe("photo.jpg");
		});

		it("should handle URLs with query strings", () => {
			const result = touchOverlay.extractFilenameFromUrl("https://example.com/images/photo.jpg?size=large");

			expect(result).toBe("photo.jpg");
		});

		it("should return null for invalid URLs", () => {
			expect(touchOverlay.extractFilenameFromUrl(null)).toBeNull();
			expect(touchOverlay.extractFilenameFromUrl("")).toBeNull();
		});
	});

	describe("getImageUrlFromElement", () => {
		it("should return src for img elements", () => {
			const img = { tagName: "IMG", src: "https://example.com/photo.jpg", dataset: {} };

			expect(touchOverlay.getImageUrlFromElement(img)).toBe("https://example.com/photo.jpg");
		});

		it("should return currentSrc for video elements", () => {
			const video = { tagName: "VIDEO", currentSrc: "https://example.com/clip.mp4", src: "" };

			expect(touchOverlay.getImageUrlFromElement(video)).toBe("https://example.com/clip.mp4");
		});

		it("should return background image URL for div elements", () => {
			const div = {
				tagName: "DIV",
				style: { backgroundImage: "url(\"https://example.com/bg.jpg\")" },
				dataset: {}
			};

			expect(touchOverlay.getImageUrlFromElement(div)).toBe("https://example.com/bg.jpg");
		});

		it("should return dataset src when no background image is present", () => {
			const div = {
				tagName: "DIV",
				style: { backgroundImage: "none" },
				dataset: { src: "https://example.com/fallback.jpg" }
			};

			expect(touchOverlay.getImageUrlFromElement(div)).toBe("https://example.com/fallback.jpg");
		});

		it("should return null when no URL is available", () => {
			const div = { tagName: "DIV", style: { backgroundImage: "none" }, dataset: {} };

			expect(touchOverlay.getImageUrlFromElement(div)).toBeNull();
		});
	});

	describe("overlayState management", () => {
		it("should initialize with closed state", () => {
			expect(touchOverlay.overlayState.isOpen).toBe(false);
			expect(touchOverlay.overlayState.contentType).toBeNull();
			expect(touchOverlay.overlayState.data).toBeNull();
		});
	});

	describe("uiState management", () => {
		it("should initialize with visible UI", () => {
			expect(touchOverlay.uiState.hidden).toBe(false);
		});
	});

	describe("newsData management", () => {
		it("should initialize with empty items and index 0", () => {
			expect(touchOverlay.newsData.items).toEqual([]);
			expect(touchOverlay.newsData.currentIndex).toBe(0);
		});
	});

	describe("navigateNews", () => {
		beforeEach(() => {
			// Reset news data and mock renderNewsDetail
			touchOverlay.newsData = {
				items: [
					{ title: "Article 1" },
					{ title: "Article 2" },
					{ title: "Article 3" }
				],
				currentIndex: 1
			};
			touchOverlay.renderNewsDetail = () => {}; // Mock to avoid DOM operations
		});

		it("should navigate to next article when direction is 1", () => {
			touchOverlay.navigateNews(1);
			expect(touchOverlay.newsData.currentIndex).toBe(2);
		});

		it("should navigate to previous article when direction is -1", () => {
			touchOverlay.navigateNews(-1);
			expect(touchOverlay.newsData.currentIndex).toBe(0);
		});

		it("should not navigate past the end of the list", () => {
			touchOverlay.newsData.currentIndex = 2; // Last item
			touchOverlay.navigateNews(1);
			expect(touchOverlay.newsData.currentIndex).toBe(2); // Should stay at 2
		});

		it("should not navigate before the start of the list", () => {
			touchOverlay.newsData.currentIndex = 0; // First item
			touchOverlay.navigateNews(-1);
			expect(touchOverlay.newsData.currentIndex).toBe(0); // Should stay at 0
		});
	});

	describe("defaults configuration", () => {
		it("should have correct default values", () => {
			expect(touchOverlay.defaults.animationSpeed).toBe(200);
			expect(touchOverlay.defaults.backdropOpacity).toBe(0.8);
			expect(touchOverlay.defaults.closeButtonSize).toBe(48);
			expect(touchOverlay.defaults.hideUITogglePosition).toBe("bottom-right");
			expect(touchOverlay.defaults.calendarDaysToShow).toBe(14);
			expect(touchOverlay.defaults.persistUIState).toBe(false);
			expect(touchOverlay.defaults.autoHideDelay).toBe(60);
		});

		it("should have photoViewer configuration", () => {
			expect(touchOverlay.defaults.photoViewer).toBeDefined();
			expect(touchOverlay.defaults.photoViewer.showMetadata).toBe(true);
			expect(touchOverlay.defaults.photoViewer.slideshowPauseEnabled).toBe(true);
		});
	});

	describe("photoData management", () => {
		it("should initialize with null image and metadata", () => {
			expect(touchOverlay.photoData.currentImage).toBeNull();
			expect(touchOverlay.photoData.metadata).toBeNull();
			expect(touchOverlay.photoData.slideshowPaused).toBe(false);
		});
	});

	describe("calendarData management", () => {
		it("should initialize with empty events array", () => {
			expect(touchOverlay.calendarData.events).toEqual([]);
		});
	});

	describe("inactivityState management", () => {
		it("should have lastActivity timestamp", () => {
			expect(touchOverlay.inactivityState.lastActivity).toBeDefined();
			expect(typeof touchOverlay.inactivityState.lastActivity).toBe("number");
		});

		it("should initialize with null timerId", () => {
			expect(touchOverlay.inactivityState.timerId).toBeNull();
		});
	});
});
