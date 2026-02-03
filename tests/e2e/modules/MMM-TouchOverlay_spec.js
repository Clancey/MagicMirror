const { expect } = require("playwright/test");
const helpers = require("../helpers/global-setup");

const TOUCHOVERLAY_CONFIG = "tests/configs/modules/MMM-TouchOverlay/default.js";
const OVERLAY_SELECTOR = ".touch-overlay";
const OVERLAY_BACKDROP_SELECTOR = ".touch-overlay-backdrop";
const OVERLAY_CONTENT_SELECTOR = ".touch-overlay-content";
const OVERLAY_CLOSE_BUTTON = ".touch-overlay-close";

/**
 * Helper to set up news data and open the overlay
 * @param page
 */
const openNewsOverlay = async (page) => {
	await page.evaluate(() => {
		const modules = MM.getModules();
		for (const module of modules) {
			if (module.name === "MMM-TouchOverlay") {
				module.newsData.items = [{ title: "Test Article", pubdate: new Date().toISOString(), description: "Test description" }];
				module.openOverlay("news", module.newsData);
				break;
			}
		}
	});
	// Wait for animation
	await page.waitForTimeout(400);
};

/**
 * Helper to close the overlay via module method
 * @param page
 */
const closeOverlayViaModule = async (page) => {
	await page.evaluate(() => {
		const modules = MM.getModules();
		for (const module of modules) {
			if (module.name === "MMM-TouchOverlay") {
				module.closeOverlay();
				break;
			}
		}
	});
	// Wait for animation
	await page.waitForTimeout(400);
};

/**
 * Helper to ensure overlay is closed before a test
 * @param page
 */
const ensureOverlayClosed = async (page) => {
	const isOpen = await page.evaluate(() => {
		const modules = MM.getModules();
		for (const module of modules) {
			if (module.name === "MMM-TouchOverlay") {
				return module.overlayState.isOpen;
			}
		}
		return false;
	});
	if (isOpen) {
		await closeOverlayViaModule(page);
	}
};

describe("MMM-TouchOverlay e2e tests", () => {
	let page;

	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("overlay DOM structure", () => {
		beforeAll(async () => {
			await helpers.startApplication(TOUCHOVERLAY_CONFIG);
			await helpers.getDocument();
			page = helpers.getPage();
			// Wait for modules to initialize
			await page.waitForTimeout(1000);
		});

		it("should render overlay container", async () => {
			const overlay = page.locator(OVERLAY_SELECTOR);
			await expect(overlay).toHaveCount(1);
		});

		it("should render backdrop", async () => {
			const backdrop = page.locator(OVERLAY_BACKDROP_SELECTOR);
			await expect(backdrop).toHaveCount(1);
		});

		it("should render content container", async () => {
			const content = page.locator(OVERLAY_CONTENT_SELECTOR);
			await expect(content).toHaveCount(1);
		});

		it("should render close button with aria-label", async () => {
			const closeBtn = page.locator(OVERLAY_CLOSE_BUTTON);
			await expect(closeBtn).toHaveCount(1);
			await expect(closeBtn).toHaveAttribute("aria-label", "Close");
		});

		it("should have data-visible=false initially", async () => {
			const overlay = page.locator(OVERLAY_SELECTOR);
			await expect(overlay).toHaveAttribute("data-visible", "false");
		});
	});

	describe("overlay open/close flows", () => {
		beforeAll(async () => {
			await helpers.startApplication(TOUCHOVERLAY_CONFIG);
			await helpers.getDocument();
			page = helpers.getPage();
			await page.waitForTimeout(1000);
		});

		beforeEach(async () => {
			await ensureOverlayClosed(page);
		});

		it("should set data-visible=true when overlay is opened", async () => {
			await openNewsOverlay(page);

			const overlay = page.locator(OVERLAY_SELECTOR);
			await expect(overlay).toHaveAttribute("data-visible", "true");
		});

		it("should add visible class when opened", async () => {
			await openNewsOverlay(page);

			const overlay = page.locator(OVERLAY_SELECTOR);
			await expect(overlay).toHaveClass(/visible/);
		});

		it("should close overlay when close button is clicked", async () => {
			await openNewsOverlay(page);

			// Verify overlay is open first
			const overlay = page.locator(OVERLAY_SELECTOR);
			await expect(overlay).toHaveAttribute("data-visible", "true");

			// Click close button
			const closeBtn = page.locator(OVERLAY_CLOSE_BUTTON);
			await closeBtn.click();
			await page.waitForTimeout(400);

			await expect(overlay).toHaveAttribute("data-visible", "false");
		});

		it("should close overlay when backdrop is clicked", async () => {
			await openNewsOverlay(page);

			const overlay = page.locator(OVERLAY_SELECTOR);
			await expect(overlay).toHaveAttribute("data-visible", "true");

			// Click backdrop - use force: true since content may be in front
			const backdrop = page.locator(OVERLAY_BACKDROP_SELECTOR);
			// Click on the edge of the backdrop where content doesn't overlap
			await backdrop.click({ position: { x: 10, y: 10 }, force: true });
			await page.waitForTimeout(400);

			await expect(overlay).toHaveAttribute("data-visible", "false");
		});

		it("close button should be at least 48x48px when visible", async () => {
			await openNewsOverlay(page);

			const closeBtn = page.locator(OVERLAY_CLOSE_BUTTON);
			await expect(closeBtn).toBeVisible();
			const box = await closeBtn.boundingBox();
			expect(box).not.toBeNull();
			expect(box.width).toBeGreaterThanOrEqual(48);
			expect(box.height).toBeGreaterThanOrEqual(48);
		});
	});

	describe("overlay content rendering", () => {
		beforeAll(async () => {
			await helpers.startApplication(TOUCHOVERLAY_CONFIG);
			await helpers.getDocument();
			page = helpers.getPage();
			await page.waitForTimeout(1000);
		});

		beforeEach(async () => {
			await ensureOverlayClosed(page);
		});

		it("should render news detail content", async () => {
			await openNewsOverlay(page);

			const newsDetail = page.locator(".news-detail");
			await expect(newsDetail).toBeVisible();
		});

		it("should render news headline correctly", async () => {
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.newsData.items = [{ title: "Test Headline XYZ", pubdate: new Date().toISOString() }];
						module.openOverlay("news", module.newsData);
						break;
					}
				}
			});
			await page.waitForTimeout(400);

			const headline = page.locator(".news-headline");
			await expect(headline).toBeVisible();
			await expect(headline).toContainText("Test Headline XYZ");
		});
	});

	describe("overlay state management", () => {
		beforeAll(async () => {
			await helpers.startApplication(TOUCHOVERLAY_CONFIG);
			await helpers.getDocument();
			page = helpers.getPage();
			await page.waitForTimeout(1000);
		});

		beforeEach(async () => {
			await ensureOverlayClosed(page);
		});

		it("should track isOpen state correctly", async () => {
			// Check initial state is false
			const initialState = await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						return module.overlayState.isOpen;
					}
				}
				return null;
			});
			expect(initialState).toBe(false);

			// Open and verify state is true
			await openNewsOverlay(page);
			const openState = await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						return module.overlayState.isOpen;
					}
				}
				return null;
			});
			expect(openState).toBe(true);

			// Close and verify state is false
			await closeOverlayViaModule(page);
			const closedState = await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						return module.overlayState.isOpen;
					}
				}
				return null;
			});
			expect(closedState).toBe(false);
		});

		it("should prevent opening overlay when already open", async () => {
			await openNewsOverlay(page);

			// Try to open again
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.newsData.items = [{ title: "Second Article", pubdate: new Date().toISOString() }];
						module.openOverlay("news", module.newsData);
						break;
					}
				}
			});
			await page.waitForTimeout(100);

			// Should still be open with same state
			const isOpen = await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						return module.overlayState.isOpen;
					}
				}
				return null;
			});
			expect(isOpen).toBe(true);
		});

		it("should handle close when already closed gracefully", async () => {
			// Overlay should be closed already (from beforeEach)
			const overlay = page.locator(OVERLAY_SELECTOR);
			await expect(overlay).toHaveAttribute("data-visible", "false");

			// Try to close when already closed - should not error
			await closeOverlayViaModule(page);

			// Should still be closed
			await expect(overlay).toHaveAttribute("data-visible", "false");
		});
	});

	describe("TOUCH_OVERLAY_OPEN notification", () => {
		beforeAll(async () => {
			await helpers.startApplication(TOUCHOVERLAY_CONFIG);
			await helpers.getDocument();
			page = helpers.getPage();
			await page.waitForTimeout(1000);
		});

		beforeEach(async () => {
			await ensureOverlayClosed(page);
			// Reset notification listener
			await page.evaluate(() => {
				window.testNotifications = [];
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						// Only wrap if not already wrapped
						if (!module._sendNotificationWrapped) {
							const originalSendNotification = module.sendNotification.bind(module);
							module.sendNotification = (notification, payload) => {
								window.testNotifications.push({ notification, payload });
								originalSendNotification(notification, payload);
							};
							module._sendNotificationWrapped = true;
						}
						break;
					}
				}
			});
		});

		it("should send TOUCH_OVERLAY_OPEN notification when overlay is opened", async () => {
			// Clear previous notifications
			await page.evaluate(() => {
				window.testNotifications = [];
			});

			await openNewsOverlay(page);

			const result = await page.evaluate(() => {
				return window.testNotifications.find((n) => n.notification === "TOUCH_OVERLAY_OPEN");
			});

			expect(result).toBeDefined();
			expect(result.payload).toHaveProperty("type", "news");
			expect(result.payload).toHaveProperty("data");
		});

		it("should include content type in notification payload", async () => {
			// Clear previous notifications
			await page.evaluate(() => {
				window.testNotifications = [];
			});

			await openNewsOverlay(page);

			const result = await page.evaluate(() => {
				return window.testNotifications.find((n) => n.notification === "TOUCH_OVERLAY_OPEN");
			});

			expect(result).toBeDefined();
			expect(result.payload.type).toBe("news");
		});
	});

	describe("TOUCH_OVERLAY_CLOSE notification", () => {
		beforeAll(async () => {
			await helpers.startApplication(TOUCHOVERLAY_CONFIG);
			await helpers.getDocument();
			page = helpers.getPage();
			await page.waitForTimeout(1000);
		});

		beforeEach(async () => {
			await ensureOverlayClosed(page);
			// Set up notification listener if not already done
			await page.evaluate(() => {
				window.testNotifications = [];
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						if (!module._sendNotificationWrapped) {
							const originalSendNotification = module.sendNotification.bind(module);
							module.sendNotification = (notification, payload) => {
								window.testNotifications.push({ notification, payload });
								originalSendNotification(notification, payload);
							};
							module._sendNotificationWrapped = true;
						}
						break;
					}
				}
			});
		});

		it("should send TOUCH_OVERLAY_CLOSE notification when close button is clicked", async () => {
			// Clear notifications
			await page.evaluate(() => {
				window.testNotifications = [];
			});

			await openNewsOverlay(page);

			const closeBtn = page.locator(OVERLAY_CLOSE_BUTTON);
			await closeBtn.click();
			await page.waitForTimeout(400);

			const result = await page.evaluate(() => {
				return window.testNotifications.find((n) => n.notification === "TOUCH_OVERLAY_CLOSE");
			});

			expect(result).toBeDefined();
		});

		it("should send TOUCH_OVERLAY_CLOSE notification when backdrop is clicked", async () => {
			// Clear notifications
			await page.evaluate(() => {
				window.testNotifications = [];
			});

			await openNewsOverlay(page);

			const backdrop = page.locator(OVERLAY_BACKDROP_SELECTOR);
			await backdrop.click({ position: { x: 10, y: 10 }, force: true });
			await page.waitForTimeout(400);

			const result = await page.evaluate(() => {
				return window.testNotifications.find((n) => n.notification === "TOUCH_OVERLAY_CLOSE");
			});

			expect(result).toBeDefined();
		});
	});

	describe("UI hide/show toggle", () => {
		beforeAll(async () => {
			await helpers.startApplication(TOUCHOVERLAY_CONFIG);
			await helpers.getDocument();
			page = helpers.getPage();
			await page.waitForTimeout(1000);
		});

		beforeEach(async () => {
			// Ensure UI is visible before each test
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						if (module.uiState.hidden) {
							module.showUI();
							module.uiState.hidden = false;
						}
						break;
					}
				}
			});
			await page.waitForTimeout(100);
		});

		it("should render toggle button", async () => {
			const toggleBtn = page.locator(".touch-ui-toggle");
			await expect(toggleBtn).toHaveCount(1);
			await expect(toggleBtn).toHaveAttribute("aria-label", "Hide interface");
		});

		it("should render show button (initially hidden)", async () => {
			const showBtn = page.locator(".touch-ui-show");
			await expect(showBtn).toHaveCount(1);
			await expect(showBtn).toHaveAttribute("aria-label", "Show interface");
		});

		it("toggle button should be at least 48x48px", async () => {
			const toggleBtn = page.locator(".touch-ui-toggle");
			await expect(toggleBtn).toBeVisible();
			const box = await toggleBtn.boundingBox();
			expect(box).not.toBeNull();
			expect(box.width).toBeGreaterThanOrEqual(48);
			expect(box.height).toBeGreaterThanOrEqual(48);
		});

		it("should hide UI when toggle button is clicked", async () => {
			const toggleBtn = page.locator(".touch-ui-toggle");
			await toggleBtn.click();
			await page.waitForTimeout(400);

			// Check body has ui-hidden class
			const hasClass = await page.evaluate(() => {
				return document.body.classList.contains("ui-hidden");
			});
			expect(hasClass).toBe(true);

			// Check uiState
			const isHidden = await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						return module.uiState.hidden;
					}
				}
				return null;
			});
			expect(isHidden).toBe(true);
		});

		it("should show UI when show button is clicked", async () => {
			// First hide the UI
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.uiState.hidden = true;
						module.hideUI();
						break;
					}
				}
			});
			await page.waitForTimeout(100);

			// Now click show button
			const showBtn = page.locator(".touch-ui-show");
			await showBtn.click();
			await page.waitForTimeout(400);

			// Check body does not have ui-hidden class
			const hasClass = await page.evaluate(() => {
				return document.body.classList.contains("ui-hidden");
			});
			expect(hasClass).toBe(false);
		});

		it("should swap button visibility when UI is toggled", async () => {
			// Initially toggle button should be visible, show button hidden
			const toggleBtn = page.locator(".touch-ui-toggle");
			const showBtn = page.locator(".touch-ui-show");

			await expect(toggleBtn).toBeVisible();

			// Hide UI
			await toggleBtn.click();
			await page.waitForTimeout(400);

			// Now show button should be visible, toggle button hidden
			await expect(showBtn).toBeVisible();

			// Show UI again
			await showBtn.click();
			await page.waitForTimeout(400);

			// Toggle button visible again
			await expect(toggleBtn).toBeVisible();
		});

		it("should send TOUCH_UI_HIDDEN notification on toggle", async () => {
			// Set up notification listener
			await page.evaluate(() => {
				window.testNotifications = [];
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						if (!module._sendNotificationWrapped) {
							const originalSendNotification = module.sendNotification.bind(module);
							module.sendNotification = (notification, payload) => {
								window.testNotifications.push({ notification, payload });
								originalSendNotification(notification, payload);
							};
							module._sendNotificationWrapped = true;
						}
						break;
					}
				}
			});

			// Clear notifications
			await page.evaluate(() => {
				window.testNotifications = [];
			});

			const toggleBtn = page.locator(".touch-ui-toggle");
			await toggleBtn.click();
			await page.waitForTimeout(400);

			const result = await page.evaluate(() => {
				return window.testNotifications.find((n) => n.notification === "TOUCH_UI_HIDDEN");
			});

			expect(result).toBeDefined();
			expect(result.payload).toHaveProperty("hidden", true);
		});
	});

	describe("persistUIState localStorage flow", () => {
		beforeAll(async () => {
			// Use a config with persistUIState enabled
			await helpers.startApplication(TOUCHOVERLAY_CONFIG);
			await helpers.getDocument();
			page = helpers.getPage();
			await page.waitForTimeout(1000);
		});

		beforeEach(async () => {
			// Clear localStorage and reset UI state before each test
			await page.evaluate(() => {
				localStorage.removeItem("mm-touch-ui-hidden");
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.uiState.hidden = false;
						module.showUI();
						break;
					}
				}
			});
			await page.waitForTimeout(100);
		});

		it("should not save state when persistUIState is false", async () => {
			// The default config has persistUIState: false
			const toggleBtn = page.locator(".touch-ui-toggle");
			await toggleBtn.click();
			await page.waitForTimeout(400);

			const savedState = await page.evaluate(() => {
				return localStorage.getItem("mm-touch-ui-hidden");
			});

			// Should be null since persistUIState is false in default config
			expect(savedState).toBeNull();
		});

		it("should save state when persistUIState is enabled", async () => {
			// Enable persistUIState temporarily
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.config.persistUIState = true;
						break;
					}
				}
			});

			const toggleBtn = page.locator(".touch-ui-toggle");
			await toggleBtn.click();
			await page.waitForTimeout(400);

			const savedState = await page.evaluate(() => {
				return localStorage.getItem("mm-touch-ui-hidden");
			});

			expect(savedState).toBe("true");

			// Restore config
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.config.persistUIState = false;
						break;
					}
				}
			});
		});

		it("should restore hidden state from localStorage", async () => {
			// Enable persistUIState and set localStorage
			await page.evaluate(() => {
				localStorage.setItem("mm-touch-ui-hidden", "true");
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.config.persistUIState = true;
						module.restoreUIState();
						break;
					}
				}
			});
			await page.waitForTimeout(100);

			// Check that UI is hidden
			const isHidden = await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						return module.uiState.hidden;
					}
				}
				return null;
			});

			expect(isHidden).toBe(true);

			// Restore config
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.config.persistUIState = false;
						break;
					}
				}
			});
		});

		it("should not restore state when persistUIState is false", async () => {
			// Set localStorage but keep persistUIState false
			await page.evaluate(() => {
				localStorage.setItem("mm-touch-ui-hidden", "true");
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.config.persistUIState = false;
						module.uiState.hidden = false;
						module.restoreUIState();
						break;
					}
				}
			});
			await page.waitForTimeout(100);

			// Check that UI is still visible (not restored)
			const isHidden = await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						return module.uiState.hidden;
					}
				}
				return null;
			});

			expect(isHidden).toBe(false);
		});
	});

	describe("weather detail rendering", () => {
		beforeAll(async () => {
			await helpers.startApplication(TOUCHOVERLAY_CONFIG);
			await helpers.getDocument();
			page = helpers.getPage();
			await page.waitForTimeout(1000);
		});

		beforeEach(async () => {
			await ensureOverlayClosed(page);
		});

		it("should show loading state when no weather data", async () => {
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.weatherData = null;
						module.openOverlay("weather", null);
						break;
					}
				}
			});
			await page.waitForTimeout(400);

			const loading = page.locator(".weather-loading");
			await expect(loading).toBeVisible();
			await expect(page.locator(".weather-loading-text")).toContainText("Loading weather data");
		});

		it("should render current weather when data is available", async () => {
			const mockWeatherData = {
				currentWeather: {
					temperature: 72,
					feelsLike: 75,
					humidity: 55,
					windSpeed: 10,
					weatherType: "day-sunny"
				},
				locationName: "Test City",
				hourlyArray: [],
				forecastArray: []
			};

			await page.evaluate((data) => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.weatherData = data;
						module.openOverlay("weather", data);
						break;
					}
				}
			}, mockWeatherData);
			await page.waitForTimeout(400);

			const weatherDetail = page.locator(".weather-detail");
			await expect(weatherDetail).toBeVisible();

			// Check location
			await expect(page.locator(".weather-location")).toContainText("Test City");

			// Check temperature
			await expect(page.locator(".weather-temp-large")).toContainText("72");

			// Check feels like
			const feelsLike = page.locator(".weather-detail-item").filter({ hasText: "Feels like" });
			await expect(feelsLike).toContainText("75");
		});

		it("should render hourly forecast limited to 12 hours", async () => {
			const mockWeatherData = {
				currentWeather: {
					temperature: 72,
					feelsLike: 75,
					humidity: 55,
					windSpeed: 10,
					weatherType: "day-sunny"
				},
				locationName: "Test City",
				hourlyArray: Array.from({ length: 24 }, (_, i) => ({
					date: new Date(Date.now() + i * 3600000).toISOString(),
					temperature: 70 + i,
					weatherType: "day-sunny"
				})),
				forecastArray: []
			};

			await page.evaluate((data) => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.weatherData = data;
						module.openOverlay("weather", data);
						break;
					}
				}
			}, mockWeatherData);
			await page.waitForTimeout(400);

			// Should show hourly section
			await expect(page.locator(".weather-hourly")).toBeVisible();

			// Should be limited to 12 hours
			const hourItems = page.locator(".weather-hour");
			await expect(hourItems).toHaveCount(12);
		});

		it("should render daily forecast limited to 7 days", async () => {
			const mockWeatherData = {
				currentWeather: {
					temperature: 72,
					feelsLike: 75,
					humidity: 55,
					windSpeed: 10,
					weatherType: "day-sunny"
				},
				locationName: "Test City",
				hourlyArray: [],
				forecastArray: Array.from({ length: 10 }, (_, i) => ({
					date: new Date(Date.now() + i * 86400000).toISOString(),
					maxTemperature: 80 + i,
					minTemperature: 60 + i,
					weatherType: "day-sunny"
				}))
			};

			await page.evaluate((data) => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.weatherData = data;
						module.openOverlay("weather", data);
						break;
					}
				}
			}, mockWeatherData);
			await page.waitForTimeout(400);

			// Should show forecast section
			await expect(page.locator(".weather-forecast")).toBeVisible();

			// Should be limited to 7 days
			const dayItems = page.locator(".weather-day");
			await expect(dayItems).toHaveCount(7);
		});

		it("should display UV index when available", async () => {
			const mockWeatherData = {
				currentWeather: {
					temperature: 72,
					feelsLike: 75,
					humidity: 55,
					windSpeed: 10,
					weatherType: "day-sunny",
					uvIndex: 7
				},
				locationName: "Test City",
				hourlyArray: [],
				forecastArray: []
			};

			await page.evaluate((data) => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.weatherData = data;
						module.openOverlay("weather", data);
						break;
					}
				}
			}, mockWeatherData);
			await page.waitForTimeout(400);

			const uvItem = page.locator(".weather-detail-item").filter({ hasText: "UV Index" });
			await expect(uvItem).toBeVisible();
			await expect(uvItem).toContainText("7");
		});

		it("should display precipitation probability when available", async () => {
			const mockWeatherData = {
				currentWeather: {
					temperature: 72,
					feelsLike: 75,
					humidity: 55,
					windSpeed: 10,
					weatherType: "day-cloudy",
					precipitationProbability: 30
				},
				locationName: "Test City",
				hourlyArray: [],
				forecastArray: []
			};

			await page.evaluate((data) => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.weatherData = data;
						module.openOverlay("weather", data);
						break;
					}
				}
			}, mockWeatherData);
			await page.waitForTimeout(400);

			const precipItem = page.locator(".weather-detail-item").filter({ hasText: "Precip" });
			await expect(precipItem).toBeVisible();
			await expect(precipItem).toContainText("30%");
		});

		it("should display UV index even when value is 0", async () => {
			const mockWeatherData = {
				currentWeather: {
					temperature: 72,
					feelsLike: 75,
					humidity: 55,
					windSpeed: 10,
					weatherType: "night-clear",
					uvIndex: 0
				},
				locationName: "Test City",
				hourlyArray: [],
				forecastArray: []
			};

			await page.evaluate((data) => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.weatherData = data;
						module.openOverlay("weather", data);
						break;
					}
				}
			}, mockWeatherData);
			await page.waitForTimeout(400);

			const uvItem = page.locator(".weather-detail-item").filter({ hasText: "UV Index" });
			await expect(uvItem).toBeVisible();
			await expect(uvItem).toContainText("0");
		});

		it("should not display UV index when null", async () => {
			const mockWeatherData = {
				currentWeather: {
					temperature: 72,
					feelsLike: 75,
					humidity: 55,
					windSpeed: 10,
					weatherType: "day-sunny"
					// No uvIndex field
				},
				locationName: "Test City",
				hourlyArray: [],
				forecastArray: []
			};

			await page.evaluate((data) => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.weatherData = data;
						module.openOverlay("weather", data);
						break;
					}
				}
			}, mockWeatherData);
			await page.waitForTimeout(400);

			const uvItem = page.locator(".weather-detail-item").filter({ hasText: "UV Index" });
			await expect(uvItem).toHaveCount(0);
		});
	});

	describe("photo viewer flows", () => {
		beforeAll(async () => {
			await helpers.startApplication(TOUCHOVERLAY_CONFIG);
			await helpers.getDocument();
			page = helpers.getPage();
			await page.waitForTimeout(1000);
		});

		beforeEach(async () => {
			await ensureOverlayClosed(page);
			// Reset photo data
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.photoData = {
							currentImage: null,
							metadata: null,
							slideshowPaused: false
						};
						break;
					}
				}
			});
		});

		it("should show message when no photo available", async () => {
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.photoData.currentImage = null;
						module.openOverlay("photo", module.photoData);
						break;
					}
				}
			});
			await page.waitForTimeout(400);

			await expect(page.locator(".touch-overlay-body")).toContainText("No photo available");
		});

		it("should render photo viewer with image", async () => {
			// Use a data URI for testing (small transparent pixel)
			const testImage = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

			await page.evaluate((imageUrl) => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.photoData.currentImage = imageUrl;
						module.photoData.metadata = null;
						module.openOverlay("photo", module.photoData);
						break;
					}
				}
			}, testImage);
			await page.waitForTimeout(400);

			const photoViewer = page.locator(".photo-viewer");
			await expect(photoViewer).toBeVisible();

			const img = page.locator(".photo-viewer-image");
			await expect(img).toBeVisible();
		});

		it("should render photo metadata when available", async () => {
			const testImage = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

			await page.evaluate((imageUrl) => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.photoData.currentImage = imageUrl;
						module.photoData.metadata = {
							date: "2024-01-15",
							album: "Vacation Photos",
							filename: "beach.jpg"
						};
						module.openOverlay("photo", module.photoData);
						break;
					}
				}
			}, testImage);
			await page.waitForTimeout(400);

			const metadata = page.locator(".photo-metadata");
			await expect(metadata).toBeVisible();

			await expect(page.locator(".photo-date")).toContainText("2024-01-15");
			await expect(page.locator(".photo-album")).toContainText("Vacation Photos");
			await expect(page.locator(".photo-filename")).toContainText("beach.jpg");
		});

		it("should not render metadata when showMetadata is false", async () => {
			const testImage = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

			await page.evaluate((imageUrl) => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.config.photoViewer.showMetadata = false;
						module.photoData.currentImage = imageUrl;
						module.photoData.metadata = {
							date: "2024-01-15",
							album: "Vacation Photos",
							filename: "beach.jpg"
						};
						module.openOverlay("photo", module.photoData);
						break;
					}
				}
			}, testImage);
			await page.waitForTimeout(400);

			const metadata = page.locator(".photo-metadata");
			await expect(metadata).toHaveCount(0);

			// Restore setting
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.config.photoViewer.showMetadata = true;
						break;
					}
				}
			});
		});

		it("should send SLIDESHOW_PAUSE notification when pausing", async () => {
			// Set up notification listener
			await page.evaluate(() => {
				window.testNotifications = [];
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						if (!module._sendNotificationWrapped) {
							const originalSendNotification = module.sendNotification.bind(module);
							module.sendNotification = (notification, payload) => {
								window.testNotifications.push({ notification, payload });
								originalSendNotification(notification, payload);
							};
							module._sendNotificationWrapped = true;
						}
						break;
					}
				}
			});

			// Clear notifications
			await page.evaluate(() => {
				window.testNotifications = [];
			});

			// Call pauseSlideshow
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.photoData.slideshowPaused = false;
						module.pauseSlideshow();
						break;
					}
				}
			});
			await page.waitForTimeout(100);

			const pauseNotification = await page.evaluate(() => {
				return window.testNotifications.find((n) => n.notification === "SLIDESHOW_PAUSE");
			});

			expect(pauseNotification).toBeDefined();
		});

		it("should send SLIDESHOW_RESUME notification when resuming", async () => {
			// Set up notification listener
			await page.evaluate(() => {
				window.testNotifications = [];
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						if (!module._sendNotificationWrapped) {
							const originalSendNotification = module.sendNotification.bind(module);
							module.sendNotification = (notification, payload) => {
								window.testNotifications.push({ notification, payload });
								originalSendNotification(notification, payload);
							};
							module._sendNotificationWrapped = true;
						}
						break;
					}
				}
			});

			// Clear notifications and set paused state
			await page.evaluate(() => {
				window.testNotifications = [];
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.photoData.slideshowPaused = true;
						break;
					}
				}
			});

			// Call resumeSlideshow
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.resumeSlideshow();
						break;
					}
				}
			});
			await page.waitForTimeout(100);

			const resumeNotification = await page.evaluate(() => {
				return window.testNotifications.find((n) => n.notification === "SLIDESHOW_RESUME");
			});

			expect(resumeNotification).toBeDefined();
		});

		it("should not pause slideshow if already paused", async () => {
			// Set up notification listener
			await page.evaluate(() => {
				window.testNotifications = [];
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						if (!module._sendNotificationWrapped) {
							const originalSendNotification = module.sendNotification.bind(module);
							module.sendNotification = (notification, payload) => {
								window.testNotifications.push({ notification, payload });
								originalSendNotification(notification, payload);
							};
							module._sendNotificationWrapped = true;
						}
						// Set already paused
						module.photoData.slideshowPaused = true;
						break;
					}
				}
			});

			// Clear and try to pause again
			await page.evaluate(() => {
				window.testNotifications = [];
			});

			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.pauseSlideshow();
						break;
					}
				}
			});
			await page.waitForTimeout(100);

			const notifications = await page.evaluate(() => {
				return window.testNotifications;
			});

			// Should NOT have sent pause notification since already paused
			const pauseNotification = notifications.find((n) => n.notification === "SLIDESHOW_PAUSE");
			expect(pauseNotification).toBeUndefined();
		});

		it("should resume slideshow on overlay close when viewing photo", async () => {
			const testImage = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

			// Set up notification listener
			await page.evaluate(() => {
				window.testNotifications = [];
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						if (!module._sendNotificationWrapped) {
							const originalSendNotification = module.sendNotification.bind(module);
							module.sendNotification = (notification, payload) => {
								window.testNotifications.push({ notification, payload });
								originalSendNotification(notification, payload);
							};
							module._sendNotificationWrapped = true;
						}
						break;
					}
				}
			});

			// Open photo viewer (which pauses slideshow)
			await page.evaluate((imageUrl) => {
				window.testNotifications = [];
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.photoData.currentImage = imageUrl;
						module.photoData.slideshowPaused = true;
						module.overlayState.isOpen = true;
						module.overlayState.contentType = "photo";
						break;
					}
				}
			}, testImage);

			// Clear notifications and close overlay
			await page.evaluate(() => {
				window.testNotifications = [];
			});

			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.closeOverlay();
						break;
					}
				}
			});
			await page.waitForTimeout(400);

			const resumeNotification = await page.evaluate(() => {
				return window.testNotifications.find((n) => n.notification === "SLIDESHOW_RESUME");
			});

			expect(resumeNotification).toBeDefined();
		});

		it("should set data-content attribute to photo when viewing", async () => {
			const testImage = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

			await page.evaluate((imageUrl) => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.photoData.currentImage = imageUrl;
						module.openOverlay("photo", module.photoData);
						break;
					}
				}
			}, testImage);
			await page.waitForTimeout(400);

			const overlay = page.locator(OVERLAY_SELECTOR);
			await expect(overlay).toHaveAttribute("data-content", "photo");
		});
	});

	describe("inactivity auto-hide behavior", () => {
		beforeAll(async () => {
			await helpers.startApplication(TOUCHOVERLAY_CONFIG);
			await helpers.getDocument();
			page = helpers.getPage();
			await page.waitForTimeout(1000);
		});

		beforeEach(async () => {
			// Reset UI state and inactivity timer
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.stopInactivityTimer();
						module.uiState.hidden = false;
						module.showUI();
						module.config.autoHideDelay = 0; // Disable by default
						break;
					}
				}
			});
			await page.waitForTimeout(100);
		});

		it("should not start timer when autoHideDelay is 0", async () => {
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.config.autoHideDelay = 0;
						module.startInactivityTimer();
						break;
					}
				}
			});

			const timerId = await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						return module.inactivityState.timerId;
					}
				}
				return undefined;
			});

			expect(timerId).toBeNull();
		});

		it("should not start timer when autoHideDelay is negative", async () => {
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.config.autoHideDelay = -1;
						module.startInactivityTimer();
						break;
					}
				}
			});

			const timerId = await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						return module.inactivityState.timerId;
					}
				}
				return undefined;
			});

			expect(timerId).toBeNull();
		});

		it("should start timer when autoHideDelay is positive", async () => {
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.config.autoHideDelay = 60;
						module.startInactivityTimer();
						break;
					}
				}
			});

			const timerId = await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						return module.inactivityState.timerId;
					}
				}
				return undefined;
			});

			expect(timerId).not.toBeNull();

			// Clean up timer
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.stopInactivityTimer();
						break;
					}
				}
			});
		});

		it("should update lastActivity when recordActivity is called", async () => {
			const beforeTime = Date.now();

			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						// Set lastActivity to an old time
						module.inactivityState.lastActivity = Date.now() - 60000;
						break;
					}
				}
			});
			await page.waitForTimeout(50);

			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.recordActivity();
						break;
					}
				}
			});

			const lastActivity = await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						return module.inactivityState.lastActivity;
					}
				}
				return 0;
			});

			// lastActivity should be recent (within the test execution window)
			expect(lastActivity).toBeGreaterThanOrEqual(beforeTime);
		});

		it("should stop timer and clear timerId when stopInactivityTimer is called", async () => {
			// Start a timer first
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.config.autoHideDelay = 60;
						module.startInactivityTimer();
						break;
					}
				}
			});

			// Verify timer is running
			const timerIdBefore = await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						return module.inactivityState.timerId;
					}
				}
				return undefined;
			});
			expect(timerIdBefore).not.toBeNull();

			// Stop the timer
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.stopInactivityTimer();
						break;
					}
				}
			});

			const timerIdAfter = await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						return module.inactivityState.timerId;
					}
				}
				return undefined;
			});

			expect(timerIdAfter).toBeNull();
		});

		it("should hide UI after inactivity period elapses", async () => {
			// Ensure UI is visible
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.uiState.hidden = false;
						module.showUI();
						break;
					}
				}
			});

			// Set a very short autoHideDelay for testing (1 second)
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.config.autoHideDelay = 1;
						// Set lastActivity to 5 seconds ago to trigger on next check
						module.inactivityState.lastActivity = Date.now() - 5000;
						module.startInactivityTimer();
						break;
					}
				}
			});

			// Wait for the interval to check (timer checks every 1 second, give it 2.5 seconds)
			await page.waitForTimeout(2500);

			// Check if UI is hidden
			const isHidden = await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						return module.uiState.hidden;
					}
				}
				return null;
			});

			expect(isHidden).toBe(true);

			// Clean up
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.stopInactivityTimer();
						break;
					}
				}
			});
		});

		it("should not hide UI if activity occurred recently", async () => {
			// Ensure UI is visible
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.uiState.hidden = false;
						module.showUI();
						break;
					}
				}
			});

			// Set autoHideDelay to 5 seconds, but keep activity fresh
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.config.autoHideDelay = 5;
						module.inactivityState.lastActivity = Date.now(); // Fresh activity
						module.startInactivityTimer();
						break;
					}
				}
			});

			// Wait for one timer tick
			await page.waitForTimeout(1500);

			// UI should still be visible
			const isHidden = await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						return module.uiState.hidden;
					}
				}
				return null;
			});

			expect(isHidden).toBe(false);

			// Clean up
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.stopInactivityTimer();
						break;
					}
				}
			});
		});

		it("should not hide UI if already hidden", async () => {
			// Hide UI first
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.uiState.hidden = true;
						module.hideUI();
						break;
					}
				}
			});

			// Track if toggleUI was called
			await page.evaluate(() => {
				window.toggleUICallCount = 0;
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						const originalToggleUI = module.toggleUI.bind(module);
						module.toggleUI = () => {
							window.toggleUICallCount++;
							originalToggleUI();
						};
						module._toggleUIWrapped = true;
						break;
					}
				}
			});

			// Set up timer with old lastActivity
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.config.autoHideDelay = 2;
						module.inactivityState.lastActivity = Date.now() - 5000;
						module.startInactivityTimer();
						break;
					}
				}
			});

			// Wait for timer tick
			await page.waitForTimeout(1500);

			// toggleUI should not have been called because UI was already hidden
			const callCount = await page.evaluate(() => window.toggleUICallCount);
			expect(callCount).toBe(0);

			// Clean up
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.stopInactivityTimer();
						break;
					}
				}
			});
		});

		it("should record activity on keyboard events", async () => {
			// Set lastActivity to old time
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.inactivityState.lastActivity = Date.now() - 60000;
						break;
					}
				}
			});

			const oldActivity = await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						return module.inactivityState.lastActivity;
					}
				}
				return 0;
			});

			// Simulate a keydown event
			await page.keyboard.press("a");
			await page.waitForTimeout(100);

			const newActivity = await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						return module.inactivityState.lastActivity;
					}
				}
				return 0;
			});

			expect(newActivity).toBeGreaterThan(oldActivity);
		});

		it("should record activity on mouse events", async () => {
			// Set lastActivity to old time
			await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						module.inactivityState.lastActivity = Date.now() - 60000;
						break;
					}
				}
			});

			const oldActivity = await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						return module.inactivityState.lastActivity;
					}
				}
				return 0;
			});

			// Simulate a mouse movement
			await page.mouse.move(100, 100);
			await page.waitForTimeout(100);

			const newActivity = await page.evaluate(() => {
				const modules = MM.getModules();
				for (const module of modules) {
					if (module.name === "MMM-TouchOverlay") {
						return module.inactivityState.lastActivity;
					}
				}
				return 0;
			});

			expect(newActivity).toBeGreaterThan(oldActivity);
		});
	});
});
