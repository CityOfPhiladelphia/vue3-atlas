const { Builder, By, until } = require("selenium-webdriver");
const path = require("path");
const fs = require("fs");
const chrome = require("selenium-webdriver/chrome");
const searchData = require("../helpers/searchData");
const browserSelect = searchData.BROWSER;
const URL = searchData.URL;
const isHeadless = searchData.HEADLESS_MODE; // Toggle headless mode in searchData.js (true for headless, false for non-headless)

describe("Base Page | Test in progress", function () {
  let driver;

  before(async function () {
    const chrome = require("selenium-webdriver/chrome");
    const options = new chrome.Options();

    if (isHeadless) {
      options.addArguments("--headless");
      options.addArguments("--disable-gpu");
      options.addArguments("--no-sandbox");
      options.addArguments("--disable-dev-shm-usage");
      options.windowSize({ width: 1920, height: 1080 });
    }

    driver = await new Builder()
      .forBrowser(browserSelect)
      .setChromeOptions(options)
      .build();
    await driver.manage().window().maximize();
    await driver.get(URL);
    await driver.sleep(4000); // Adjust sleep time if necessary
    await driver.manage().setTimeouts({ implicit: 60000 });
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });


  async function captureScreenshot(error) {
    console.error("Error occurred during the test:", error);
    if (driver) {
      const screenshotsDirectory = "./screenshots";
      if (!fs.existsSync(screenshotsDirectory)) {
        fs.mkdirSync(screenshotsDirectory);
      }
      const screenshot = await driver.takeScreenshot();
      const timestamp = new Date()
        .toISOString()
        .slice(0, -5)
        .replace(/:/g, "-");
      const screenshotName = `BasePage Test-${timestamp}.png`;
      const screenshotPath = path.join(screenshotsDirectory, screenshotName);
      fs.writeFileSync(screenshotPath, screenshot, { encoding: "base64" });
      console.log("------| Screenshot captured |------");
    }
  }

  it("Smoke Tests | Verify Landing Page", async function () {
    try {
      await driver.wait(
        until.elementLocated(By.css("a[class='app-title'] h1")),
        60000
      );
      await driver.wait(
        until.elementLocated(By.css("a[role='menuitem']")),
        60000
      );
      await driver.wait(
        until.elementLocated(By.css("#topic-panel-no-topics")),
        60000
      );
      await driver.wait(
        until.elementLocated(By.css("img[alt='imagery-or-basemap']")),
        60000
      ).click();
      await driver.wait(
        until.elementLocated(By.css(".button.imagery-dropdown-button")),
        60000
      );
      await driver.wait(
        until.elementLocated(By.css("img[alt='oblique-view']")),
        60000
      );
      await driver.wait(
        until.elementLocated(By.css("img[alt='street-view']")),
        60000
      );

      // Additional verifications can be added here if needed
    } catch (error) {
      await captureScreenshot(error);
      throw error;
    }
  });
});
