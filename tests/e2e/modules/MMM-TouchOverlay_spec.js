const { expect } = require("playwright/test");
const helpers = require("../helpers/global-setup");

const TOUCHOVERLAY_CONFIG = "tests/configs/modules/MMM-TouchOverlay/default.js";
const OVERLAY_SELECTOR = ".touch-overlay";
const OVERLAY_BACKDROP_SELECTOR = ".touch-overlay-backdrop";
const OVERLAY_CONTENT_SELECTOR = ".touch-overlay-content";
const OVERLAY_CLOSE_BUTTON = ".touch-overlay-close";
const OVERLAY_BODY = ".touch-overlay-body";

describe("MMM-TouchOverlay overlay open/close flows", () => {
	let page;

	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("overlay DOM structure", () => {
		beforeAll(async () => {
			await helpers.startApplication(TOUCHOVERLAY_CONFIG);
			await helpers.getDocument();
			page = helpers.getPage();
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

		it("should render close button", async () => {
			const closeBtn = page.locator(OVERLAY_CLOSE_BUTTON);
			await expect(closeBtn).toHaveCount(1);
			await expect(closeBtn).toHaveAttribute("aria-label", "Close");
		});

		it("should have data-visible=false initially", async () => {
			const overlay = page.locator(OVERLAY_SELECTOR);
			await expect(overlay).toHaveAttribute("data-visible", "false");
		});

		it("close button should be 48x48px minimum", async () => {
			const closeBtn = page.locator(OVERLAY_CLOSE_BUTTON);
			const box = await closeBtn.boundingBox();
			expect(box.width).toBeGreaterThanOrEqual(48);
			expect(box.height).toBeGreaterThanOrEqual(48);
		});
	});

	describe("overlay open flow", () => {
		beforeAll(async () => {
			await helpers.startApplication(TOUCHOVERLAY_CONFIG);
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should set data-visible=true when overlay is opened", async () => {
			await page.evaluate(() => {
				Module.definitions.forEach((moduleDefinition) => {
					if (moduleDefinition.name === "MMM-TouchOverlay") {
						moduleDefinition.loadedModules.forEach((module) => {
							module.newsItems = [{ title: "Test", pubdate: new Date().toISOString() }];
							module.newsData.items = [{ title: "Test", pubdate: new Date().toISOString() }];
							module.openOverlay("news", module.newsData);
						});
					}
				});
			});

			await page.waitForTimeout(300);

			const overlay = page.locator(OVERLAY_SELECTOR);
			await expect(overlay).toHaveAttribute("data-visible", "true");
		});

		it("should add visible class after open", async () => {
			await page.evaluate(() => {
				Module.definitions.forEach((moduleDefinition) => {
					if (moduleDefinition.name === "MMM-TouchOverlay") {
						moduleDefinition.loadedModules.forEach((module) => {
							module.newsItems = [{ title: "Test", pubdate: new Date().toISOString() }];
							module.newsData.items = [{ title: "Test", pubdate: new Date().toISOString() }];
							module.openOverlay("news", module.newsData);
						});
					}
				});
			});

			await page.waitForTimeout(300);

			const overlay = page.locator(OVERLAY_SELECTOR);
			const className = await overlay.getAttribute("class");
			expect(className).toContain("visible");
		});
	});

	describe("overlay close flow", () => {
		beforeAll(async () => {
			await helpers.startApplication(TOUCHOVERLAY_CONFIG);
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should close overlay when close button is clicked", async () => {
			await page.evaluate(() => {
				Module.definitions.forEach((moduleDefinition) => {
					if (moduleDefinition.name === "MMM-TouchOverlay") {
						moduleDefinition.loadedModules.forEach((module) => {
							module.newsItems = [{ title: "Test", pubdate: new Date().toISOString() }];
							module.newsData.items = [{ title: "Test", pubdate: new Date().toISOString() }];
							module.openOverlay("news", module.newsData);
						});
					}
				});
			});

			await page.waitForTimeout(300);

			const closeBtn = page.locator(OVERLAY_CLOSE_BUTTON);
			await closeBtn.click();

			await page.waitForTimeout(300);

			const overlay = page.locator(OVERLAY_SELECTOR);
			await expect(overlay).toHaveAttribute("data-visible", "false");
		});

		it("should close overlay when backdrop is clicked", async () => {
			await page.evaluate(() => {
				Module.definitions.forEach((moduleDefinition) => {
					if (moduleDefinition.name === "MMM-TouchOverlay") {
						moduleDefinition.loadedModules.forEach((module) => {
							module.newsItems = [{ title: "Test", pubdate: new Date().toISOString() }];
							module.newsData.items = [{ title: "Test", pubdate: new Date().toISOString() }];
							module.openOverlay("news", module.newsData);
						});
					}
				});
			});

			await page.waitForTimeout(300);

			const backdrop = page.locator(OVERLAY_BACKDROP_SELECTOR);
			await backdrop.click();

			await page.waitForTimeout(300);

			const overlay = page.locator(OVERLAY_SELECTOR);
			await expect(overlay).toHaveAttribute("data-visible", "false");
		});
	});

	describe("overlay content rendering", () => {
		beforeAll(async () => {
			await helpers.startApplication(TOUCHOVERLAY_CONFIG);
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should render news detail content", async () => {
			await page.evaluate(() => {
				Module.definitions.forEach((moduleDefinition) => {
					if (moduleDefinition.name === "MMM-TouchOverlay") {
						moduleDefinition.loadedModules.forEach((module) => {
							module.newsItems = [{ title: "Test Article", pubdate: new Date().toISOString(), description: "Test description" }];
							module.newsData.items = [{ title: "Test Article", pubdate: new Date().toISOString(), description: "Test description" }];
							module.openOverlay("news", module.newsData);
						});
					}
				});
			});

			await page.waitForTimeout(300);

			const newsDetail = page.locator(".news-detail");
			await expect(newsDetail).toBeVisible();
		});

		it("should render news headline", async () => {
			await page.evaluate(() => {
				Module.definitions.forEach((moduleDefinition) => {
					if (moduleDefinition.name === "MMM-TouchOverlay") {
						moduleDefinition.loadedModules.forEach((module) => {
							module.newsItems = [{ title: "Test Headline", pubdate: new Date().toISOString() }];
							module.newsData.items = [{ title: "Test Headline", pubdate: new Date().toISOString() }];
							module.openOverlay("news", module.newsData);
						});
					}
				});
			});

			await page.waitForTimeout(300);

			const headline = page.locator(".news-headline");
			await expect(headline).toBeVisible();
			await expect(headline).toHaveText("Test Headline");
		});
	});

	describe("overlay state management", () => {
		beforeAll(async () => {
			await helpers.startApplication(TOUCHOVERLAY_CONFIG);
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should prevent opening overlay when already open", async () => {
			await page.evaluate(() => {
				Module.definitions.forEach((moduleDefinition) => {
					if (moduleDefinition.name === "MMM-TouchOverlay") {
						moduleDefinition.loadedModules.forEach((module) => {
							module.newsItems = [{ title: "Test", pubdate: new Date().toISOString() }];
							module.newsData.items = [{ title: "Test", pubdate: new Date().toISOString() }];
							module.openOverlay("news", module.newsData);
							module.openOverlay("news", module.newsData);
						});
					}
				});
			});

			await page.waitForTimeout(300);

			const isOpen = await page.evaluate(() => {
				let overlayOpen = false;
				Module.definitions.forEach((moduleDefinition) => {
					if (moduleDefinition.name === "MMM-TouchOverlay") {
						moduleDefinition.loadedModules.forEach((module) => {
							overlayOpen = module.overlayState.isOpen;
						});
					}
				});
				return overlayOpen;
			});

			expect(isOpen).toBe(true);
		});

		it("should prevent closing overlay when already closed", async () => {
			const overlay = page.locator(OVERLAY_SELECTOR);

			await expect(overlay).toHaveAttribute("data-visible", "false");

			await page.evaluate(() => {
				Module.definitions.forEach((moduleDefinition) => {
					if (moduleDefinition.name === "MMM-TouchOverlay") {
						moduleDefinition.loadedModules.forEach((module) => {
							module.closeOverlay();
						});
					}
				});
			});

			await page.waitForTimeout(300);

			await expect(overlay).toHaveAttribute("data-visible", "false");
		});
	});
});

describe("TOUCH_OVERLAY_OPEN notification", () => {
	let page;

	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("notification on overlay open", () => {
		beforeAll(async () => {
			await helpers.startApplication(TOUCHOVERLAY_CONFIG);
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should send TOUCH_OVERLAY_OPEN notification when overlay is opened", async () => {
			let notifications = [];

			await page.evaluate(() => {
				window.testNotifications = [];
				Module.definitions.forEach((moduleDefinition) => {
					if (moduleDefinition.name === "MMM-TouchOverlay") {
						moduleDefinition.loadedModules.forEach((module) => {
							const originalSendNotification = module.sendNotification.bind(module);
							module.sendNotification = (notification, payload) => {
								window.testNotifications.push({ notification, payload });
								originalSendNotification(notification, payload);
							};
						});
					}
				});
			});

			await page.evaluate(() => {
				Module.definitions.forEach((moduleDefinition) => {
					if (moduleDefinition.name === "MMM-TouchOverlay") {
						moduleDefinition.loadedModules.forEach((module) => {
							module.newsItems = [{ title: "Test", pubdate: new Date().toISOString() }];
							module.newsData.items = [{ title: "Test", pubdate: new Date().toISOString() }];
							module.openOverlay("news", module.newsData);
						});
					}
				});
			});

			await page.waitForTimeout(300);

			const result = await page.evaluate(() => {
				return window.testNotifications.find((n) => n.notification === "TOUCH_OVERLAY_OPEN");
			});

			expect(result).toBeDefined();
			expect(result.payload).toHaveProperty("type", "news");
			expect(result.payload).toHaveProperty("data");
		});

		it("should include content type in notification payload", async () => {
			let notifications = [];

			await page.evaluate(() => {
				window.testNotifications = [];
				Module.definitions.forEach((moduleDefinition) => {
					if (moduleDefinition.name === "MMM-TouchOverlay") {
						moduleDefinition.loadedModules.forEach((module) => {
							const originalSendNotification = module.sendNotification.bind(module);
							module.sendNotification = (notification, payload) => {
								window.testNotifications.push({ notification, payload });
								originalSendNotification(notification, payload);
							};
						});
					}
				});
			});

			await page.evaluate(() => {
				Module.definitions.forEach((moduleDefinition) => {
					if (moduleDefinition.name === "MMM-TouchOverlay") {
						moduleDefinition.loadedModules.forEach((module) => {
							module.newsItems = [{ title: "Test", pubdate: new Date().toISOString() }];
							module.newsData.items = [{ title: "Test", pubdate: new Date().toISOString() }];
							module.openOverlay("news", module.newsData);
						});
					}
				});
			});

			await page.waitForTimeout(300);

			const result = await page.evaluate(() => {
				return window.testNotifications.find((n) => n.notification === "TOUCH_OVERLAY_OPEN");
			});

			expect(result).toBeDefined();
			expect(result.payload.type).toBe("news");
		});
	});
});

describe("TOUCH_OVERLAY_CLOSE notification", () => {
	let page;

	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("notification on overlay close", () => {
		beforeAll(async () => {
			await helpers.startApplication(TOUCHOVERLAY_CONFIG);
			await helpers.getDocument();
			page = helpers.getPage();
		});

		it("should send TOUCH_OVERLAY_CLOSE notification when overlay is closed", async () => {
			await page.evaluate(() => {
				window.testNotifications = [];
				Module.definitions.forEach((moduleDefinition) => {
					if (moduleDefinition.name === "MMM-TouchOverlay") {
						moduleDefinition.loadedModules.forEach((module) => {
							const originalSendNotification = module.sendNotification.bind(module);
							module.sendNotification = (notification, payload) => {
								window.testNotifications.push({ notification, payload });
								originalSendNotification(notification, payload);
							};
						});
					}
				});
			});

			await page.evaluate(() => {
				Module.definitions.forEach((moduleDefinition) => {
					if (moduleDefinition.name === "MMM-TouchOverlay") {
						moduleDefinition.loadedModules.forEach((module) => {
							module.newsItems = [{ title: "Test", pubdate: new Date().toISOString() }];
							module.newsData.items = [{ title: "Test", pubdate: new Date().toISOString() }];
							module.openOverlay("news", module.newsData);
						});
					}
				});
			});

			await page.waitForTimeout(300);

			const closeBtn = page.locator(OVERLAY_CLOSE_BUTTON);
			await closeBtn.click();

			await page.waitForTimeout(300);

			const result = await page.evaluate(() => {
				return window.testNotifications.find((n) => n.notification === "TOUCH_OVERLAY_CLOSE");
			});

			expect(result).toBeDefined();
		});

		it("should send notification on backdrop click close", async () => {
			await page.evaluate(() => {
				window.testNotifications = [];
				Module.definitions.forEach((moduleDefinition) => {
					if (moduleDefinition.name === "MMM-TouchOverlay") {
						moduleDefinition.loadedModules.forEach((module) => {
							const originalSendNotification = module.sendNotification.bind(module);
							module.sendNotification = (notification, payload) => {
								window.testNotifications.push({ notification, payload });
								originalSendNotification(notification, payload);
							};
						});
					}
				});
			});

			await page.evaluate(() => {
				Module.definitions.forEach((moduleDefinition) => {
					if (moduleDefinition.name === "MMM-TouchOverlay") {
						moduleDefinition.loadedModules.forEach((module) => {
							module.newsItems = [{ title: "Test", pubdate: new Date().toISOString() }];
							module.newsData.items = [{ title: "Test", pubdate: new Date().toISOString() }];
							module.openOverlay("news", module.newsData);
						});
					}
				});
			});

			await page.waitForTimeout(300);

			const backdrop = page.locator(OVERLAY_BACKDROP_SELECTOR);
			await backdrop.click();

			await page.waitForTimeout(300);

			const result = await page.evaluate(() => {
				return window.testNotifications.find((n) => n.notification === "TOUCH_OVERLAY_CLOSE");
			});

			expect(result).toBeDefined();
		});
	});
});
