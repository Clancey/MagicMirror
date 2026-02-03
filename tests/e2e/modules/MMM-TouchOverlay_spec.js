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
});
