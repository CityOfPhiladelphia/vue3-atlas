const { Builder, By, until } = require("selenium-webdriver");
const { buildingAddressData } = require("../helpers/searchData");
const path = require("path");
const fs = require("fs");
const chrome = require("selenium-webdriver/chrome");
const searchData = require("../helpers/searchData");
const browserSelect = searchData.BROWSER;
const URL = searchData.URL; 
const isHeadless = searchData.HEADLESS_MODE; // Toggle headless mode in searchData.js (true for headless, false for non-headless)

describe("Building Search Page | Tests are in progress", function () {
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
      const screenshotName = `Building SearchPage Test-${timestamp}.png`;
      const screenshotPath = path.join(screenshotsDirectory, screenshotName);
      fs.writeFileSync(screenshotPath, screenshot, { encoding: "base64" });
      console.log("------| Screenshot captured |------");
    }
  }

  it("Verify Search Functionality", async function () {
    try {
      await driver.manage().setTimeouts({ implicit: 60000 });
      const searchInput = await driver.wait(
        until.elementLocated(By.css("#map-search-input")),
        60000
      );
      await searchInput.sendKeys(buildingAddressData.address);
      const searchButton = await driver.wait(
        until.elementLocated(By.css("button[title='Address Search Button']")),
        60000
      );
      await searchButton.click();
      await driver.wait(
        until.elementLocated(
          By.css("section[id='Property Assessments-topic'] h1[class='name-holder']")
        ),
        60000
      );
      await driver.wait(
        until.elementLocated(
          By.css("section[id='Deeds-topic'] div[class='topic-name']")
        ),
        60000
      );
      await driver.wait(
        until.elementLocated(
          By.css(
            "section[id='Licenses & Inspections-topic'] h1[class='name-holder']"
          )
        ),
        60000
      );
      await driver.wait(
        until.elementLocated(
          By.css("section[id='Zoning-topic'] div[class='topic-name']")
        ),
        60000
      );
      await driver.wait(
        until.elementLocated(
          By.css("section[id='Voting-topic'] div[class='topic-name']")
        ),
        60000
      );
      await driver.wait(
        until.elementLocated(
          By.css("section[id='Nearby Activity-topic'] div[class='topic-name']")
        ),
        60000
      );
    } catch (error) {
      await captureScreenshot(error);
      throw error;
    }
  });

  it("Verify Topic Property Assessment", async function () {
    try {
      await driver.manage().setTimeouts({ implicit: 60000 });
      const table = await driver.wait(until.elementLocated(By.css("table")), 60000);
      const tableText = await table.getText();
      //console.log(tableText);

      if (
        !tableText.includes(buildingAddressData.opaAccount) ||
        !tableText.includes(buildingAddressData.opaAccountValue) ||
        !tableText.includes(buildingAddressData.opaAddress) ||
        !tableText.includes(buildingAddressData.opaAddressValue)
      ) {
        throw new Error("Property Assessment verification failed");
      }
    } catch (error) {
      await captureScreenshot(error);
      throw error;
    }
  });

  it("Verify Topic Deeds", async function () {
    try {
      await driver.manage().setTimeouts({ implicit: 60000 });
      const deedsTopic = await driver.wait(
        until.elementLocated(
          By.css("section[id='Deeds-topic'] div[class='topic-name']")
        ),
        60000
      );
      await deedsTopic.click();
      const parcelElement = await driver.wait(
        until.elementLocated(
          By.css(
            ".dor-parcel-select.column.is-one-quarter-desktop.is-half-mobile.has-text-centered.add-borders.p-2.is-selected"
          )
        ),
        60000
      );
      const tableText = await parcelElement.getText();

      if (!tableText.includes(buildingAddressData.parcelId)) {
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
      const licensesAndInspectionsTopic = await driver.wait(
        until.elementLocated(
          By.css(
            "section[id='Licenses & Inspections-topic'] button[class='topic is-vcentered']"
          )
        ),
        60000
      );
      await licensesAndInspectionsTopic.click();
      const tables = await driver.wait(until.elementsLocated(By.css(".inside-topic")), 60000);

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
      await driver.manage().setTimeouts({ implicit: 60000 });
      const zoningTopic = await driver.wait(
        until.elementLocated(
          By.css("section[id='Zoning-topic'] div[class='topic-name']")
        ),
        60000
      );
      await zoningTopic.click();
      const tableElement = await driver.wait(
        until.elementLocated(By.css("div[class='column is-3 badge-cell'] b")),
        60000
      );
      const tableText = await tableElement.getText();

      if (tableText !== buildingAddressData.parcelDescription) {
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
      const votingTopic = await driver.wait(
        until.elementLocated(
          By.css("section[id='Voting-topic'] div[class='topic-name']")
        ),
        60000
      );
      await votingTopic.click();
      const tables = await driver.wait(until.elementsLocated(By.css("#pollingPlaceTable")), 60000);

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
      const nearbyActivityTopic = await driver.wait(
        until.elementLocated(
          By.css(
            "section[id='Nearby Activity-topic'] button[class='topic is-vcentered']"
          )
        ),
        60000
      );
      await nearbyActivityTopic.click();
      const tables = await driver.wait(until.elementsLocated(By.css("table")), 60000);

      if (tables.length !== 1) {
        throw new Error("Nearby verification failed");
      }
    } catch (error) {
      await captureScreenshot(error);
      throw error;
    }
  });
});
