const { Builder, By, until } = require("selenium-webdriver");
const path = require("path");
const fs = require("fs");
const { dorAddressData } = require("../helpers/searchData");
const searchData = require("../helpers/searchData");
const URL = searchData.URL;
const browserSelect = searchData.BROWSER;
const isHeadless = searchData.HEADLESS_MODE; // Toggle headless mode in searchData.js (true for headless, false for non-headless)

describe("DOR | Tests are in progress", function () {
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
      const screenshotName = `DORTest-${timestamp}.png`;
      const screenshotPath = path.join(screenshotsDirectory, screenshotName);
      fs.writeFileSync(screenshotPath, screenshot, { encoding: "base64" });
      console.log("------| Screenshot captured |------");
    }
  }

  async function performSearch(address) {
    await driver.wait(until.elementLocated(By.css("#map-search-input")), 60000);
    let searchInput = await driver.findElement(By.css("#map-search-input"));
    await searchInput.clear();
    await searchInput.sendKeys(address);
    await driver.wait(until.elementLocated(By.css("button[title='Address Search Button']")), 60000);
    await driver.findElement(By.css("button[title='Address Search Button']")).click();
  }

  it("Verify Topic Deeds", async function () {
    try {
      await driver.manage().setTimeouts({ implicit: 60000 });
      await performSearch(dorAddressData.address);
      await driver.wait(until.elementLocated(By.css("section[id='Deeds-topic'] button[class='topic is-vcentered']")), 60000);
      await driver
        .findElement(
          By.css("section[id='Deeds-topic'] button[class='topic is-vcentered']")
        )
        .click();
      await driver.wait(until.elementLocated(By.css("#dorTable")), 60000);
      const table = await driver.findElement(By.css("#dorTable"));
      const tableText = await table.getText();

      if (
        !tableText.includes(dorAddressData.opaAccount) ||
        !tableText.includes(dorAddressData.opaAccountValue) ||
        !tableText.includes(dorAddressData.opaAddress) ||
        !tableText.includes(dorAddressData.opaAddressValue) ||
        !tableText.includes(dorAddressData.parcelId)
      ) {
        throw new Error("Deeds verification failed");
      }
    } catch (error) {
      await captureScreenshot(error);
      throw error;
    }
  });

  it("Verify Topic Licenses and Inspection", async function () {
    try {
      await driver.manage().setTimeouts({ implicit: 60000 });
      await performSearch(dorAddressData.address);
      await driver.wait(until.elementLocated(By.css("section[id='Licenses & Inspections-topic'] button[class='topic is-vcentered']")), 60000);
      await driver
        .findElement(
          By.css(
            "section[id='Licenses & Inspections-topic'] button[class='topic is-vcentered']"
          )
        )
        .click();
      await driver.wait(until.elementLocated(By.css(".inside-topic")), 60000);
      const tables = await driver.findElements(By.css(".inside-topic"));
      if (tables.length !== 1) {
        throw new Error("Licenses and Inspection verification failed");
      }
    } catch (error) {
      await captureScreenshot(error);
      throw error;
    }
  });

  it("Verify Topic Zoning", async function () {
    try {
      //closing the LI tab
      await driver
      .findElement(
        By.css(
          "section[id='Licenses & Inspections-topic'] button[class='topic is-vcentered']"
        )
      )
      .click();
      await performSearch(dorAddressData.address);
      await driver.manage().setTimeouts({ implicit: 60000 });
      await driver.wait(until.elementLocated(By.css("section[id='Zoning-topic'] div[class='topic-name']")), 60000);
      await driver
        .findElement(
          By.css("section[id='Zoning-topic'] div[class='topic-name']")
        )
        .click();
      driver.sleep(2000);
      await driver.wait(until.elementLocated(By.css("div[class='column is-3 badge-cell'] b")), 60000);
      const table = await driver.findElement(
        By.css("div[class='column is-3 badge-cell'] b")
      );
      const tableText = await table.getText();
      //console.log(tableText);
      if (tableText !== dorAddressData.parcelDescription) {
        throw new Error("Zoning verification failed");
      }
    } catch (error) {
      await captureScreenshot(error);
      throw error;
    }
  });

  it("Verify Topic Voting", async function () {
    try {
      await driver.manage().setTimeouts({ implicit: 60000 });
      await driver.wait(until.elementLocated(By.css("section[id='Voting-topic'] div[class='topic-name']")), 60000);
      await driver
        .findElement(
          By.css("section[id='Voting-topic'] div[class='topic-name']")
        )
        .click();
      await driver.wait(until.elementLocated(By.css("#pollingPlaceTable")), 60000);
      const tables = await driver.findElements(By.css("#pollingPlaceTable"));
      if (tables.length !== 1) {
        throw new Error("Voting verification failed");
      }
    } catch (error) {
      await captureScreenshot(error);
      throw error;
    }
  });

  it("Verify Topic Nearby", async function () {
    try {
      await driver.manage().setTimeouts({ implicit: 60000 });
      await driver.wait(until.elementLocated(By.css("section[id='Nearby Activity-topic'] button[class='topic is-vcentered']")), 60000);
      await driver
        .findElement(
          By.css(
            "section[id='Nearby Activity-topic'] button[class='topic is-vcentered']"
          )
        )
        .click();
      await driver.wait(until.elementLocated(By.xpath("(//tbody)[1]")), 60000);
      const tables = await driver.findElements(By.xpath("(//tbody)[1]"));
      if (tables.length !== 1) {
        throw new Error("Nearby verification failed");
      }
    } catch (error) {
      await captureScreenshot(error);
      throw error;
    }
  });
});
