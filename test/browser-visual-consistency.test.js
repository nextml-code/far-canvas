const puppeteer = require("puppeteer");
const PNG = require("pngjs").PNG;
const fs = require("fs");
const path = require("path");
const http = require("http");
const finalhandler = require("finalhandler"); // npm i finalhandler serve-static
const serveStatic = require("serve-static"); // npm i finalhandler serve-static

// Handle pixelmatch import (ES module)
let pixelmatch;
try {
  // Try CommonJS first
  pixelmatch = require("pixelmatch");
} catch (e) {
  try {
    // Try ES module default export
    pixelmatch = require("pixelmatch").default;
  } catch (e2) {
    throw new Error("Could not import pixelmatch: " + e2.message);
  }
}

describe("Browser Visual Consistency Test (Puppeteer with HTTP Server)", () => {
  let browser;
  let page;
  let server;
  const PORT = 18374; // Choose an unlikely port
  const PROJECT_ROOT = path.resolve(__dirname, "..");

  const CI = process.env.CI === "true";
  const launchOptions = {
    headless: CI ? "new" : false, // Show browser locally for easier debugging
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  };

  beforeAll(async () => {
    const htmlPath = path.resolve(PROJECT_ROOT, "example", "browser-test.html");
    const jsPath = path.resolve(PROJECT_ROOT, "src", "index.js");
    const pkgPath = path.resolve(PROJECT_ROOT, "package.json");

    console.log(`Checking existence of: ${htmlPath}`);
    if (!fs.existsSync(htmlPath)) {
      throw new Error(`FATAL: browser-test.html does not exist at ${htmlPath}`);
    }
    console.log(`Checking existence of: ${jsPath}`);
    if (!fs.existsSync(jsPath)) {
      throw new Error(`FATAL: src/index.js does not exist at ${jsPath}`);
    }
    console.log(`Checking existence of: ${pkgPath}`);
    if (!fs.existsSync(pkgPath)) {
      throw new Error(`FATAL: package.json does not exist at ${pkgPath}`);
    }
    console.log("All critical files exist.");

    server = http.createServer((req, res) => {
      console.log(`HTTP Server: Received request for ${req.url}`);
      let requestedFilePath = "";

      if (req.url === "/example/browser-test.html") {
        requestedFilePath = path.resolve(
          PROJECT_ROOT,
          "example",
          "browser-test.html"
        );
        fs.readFile(requestedFilePath, (err, data) => {
          if (err) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({ error: err.message, path: requestedFilePath })
            );
            console.error(`SERVER ERROR reading ${requestedFilePath}:`, err);
            return;
          }
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(data);
        });
      } else if (req.url === "/src/index.js") {
        requestedFilePath = path.resolve(PROJECT_ROOT, "src", "index.js");
        fs.readFile(requestedFilePath, (err, data) => {
          if (err) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({ error: err.message, path: requestedFilePath })
            );
            console.error(`SERVER ERROR reading ${requestedFilePath}:`, err);
            return;
          }
          res.writeHead(200, { "Content-Type": "application/javascript" });
          res.end(data);
        });
      } else if (req.url === "/package.json") {
        requestedFilePath = path.resolve(PROJECT_ROOT, "package.json");
        fs.readFile(requestedFilePath, (err, data) => {
          if (err) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({ error: err.message, path: requestedFilePath })
            );
            console.error(`SERVER ERROR reading ${requestedFilePath}:`, err);
            return;
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(data);
        });
      } else {
        console.log(`HTTP Server: Unhandled path ${req.url}, sending 404.`);
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Resource not found by test server.");
      }
    });

    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(
      `Test HTTP server (manual routing with path.resolve) running on http://localhost:${PORT}`
    );

    browser = await puppeteer.launch(launchOptions);
    page = await browser.newPage();

    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
    page.on("pageerror", (error) => console.log("PAGE ERROR:", error.message));
    page.on("requestfailed", (request) => {
      console.log(
        "PAGE REQ FAIL:",
        request.failure()?.errorText,
        request.url()
      );
    });
    page.on("response", (response) => {
      console.log("PAGE RESPONSE:", response.status(), response.url());
    });

    // Test 1: Try to load package.json (still useful for basic server check)
    const rootTestUrl = `http://localhost:${PORT}/package.json`;
    console.log(`Attempting to load ROOT test URL: ${rootTestUrl}`);
    try {
      const response = await page.goto(rootTestUrl, {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      });
      console.log(`ROOT Test URL loaded with status: ${response.status()}`);
      if (!response.ok())
        throw new Error(`Failed to load root test URL: ${response.status()}`);
      const content = await response.text();
      if (!content.includes("far-canvas"))
        throw new Error("package.json content incorrect");
      console.log(
        "Successfully loaded and verified /package.json from server."
      );
    } catch (e) {
      console.error("Error loading ROOT test URL (/package.json):", e);
      await browser.close();
      await new Promise((resolve) => server.close(resolve));
      throw e;
    }

    // Test 2: Load the actual example page
    const pageUrl = `http://localhost:${PORT}/example/browser-test.html`;
    console.log(`Attempting to load page from: ${pageUrl}`);
    try {
      await page.goto(pageUrl, {
        waitUntil: "domcontentloaded",
        timeout: 20000,
      });
      console.log("Page.goto for browser-test.html finished.");
      // Wait specifically for runSelectedTests to be available, as it's key for interaction
      await page.waitForFunction(
        () => typeof window.runSelectedTests === "function",
        { timeout: 15000 }
      );
      console.log(
        "browser-test.html window.runSelectedTests is now a function."
      );
    } catch (e) {
      console.error(
        "Error during page.goto or waiting for runSelectedTests:",
        e
      );
      const pageContentOnErr = await page
        .content()
        .catch(() => "Failed to get page content.");
      fs.writeFileSync("puppeteer_load_error_content.html", pageContentOnErr);
      console.log(
        "Saved page content to puppeteer_load_error_content.html on load failure."
      );
      if (browser) await browser.close();
      if (server) await new Promise((resolve) => server.close(resolve));
      throw e;
    }
  }, 60000);

  afterAll(async () => {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
    console.log("Test HTTP server closed.");
  });

  test("Far-canvas rendering of example snippets should be visually identical between near and far focus in browser", async () => {
    console.log(
      "Test: Ensuring window.runSelectedTests is callable (already checked in beforeAll)..."
    );
    try {
      await page.evaluate(() => {
        if (typeof window.runSelectedTests !== "function")
          throw new Error(
            "window.runSelectedTests is not a function post-beforeAll"
          );
        window.automatedTestRunning = true; // Signal to the page that Puppeteer is in control
      });
      console.log(
        "Test: window.runSelectedTests confirmed callable and automatedTestRunning flag set."
      );
    } catch (e) {
      console.error(
        "Test: window.runSelectedTests not callable when test started.",
        e
      );
      throw e;
    }

    console.log(
      "Test: Selecting 'Far-Canvas Data URL Comparison' test and clicking Run..."
    );
    await page.select("#specificTest", "Far-Canvas Data URL Comparison");

    // Click the button to trigger runSelectedTests
    await page.click('button[onclick="runSelectedTests()"]');
    console.log("Test: Clicked Run Tests button.");

    // Wait for the test to complete and results to be available
    await page.waitForFunction(
      () => typeof window.farCanvasDataURLTest === "object",
      { timeout: 10000 }
    );
    console.log("Test: farCanvasDataURLTest results are available.");

    // Get the test results
    const testResults = await page.evaluate(() => window.farCanvasDataURLTest);

    console.log(
      `Near focus (${testResults.focusNear}) DataURL length: ${testResults.lengthNear}`
    );
    console.log(
      `Far focus (${testResults.focusFar}) DataURL length: ${testResults.lengthFar}`
    );
    console.log(`DataURLs identical: ${testResults.identical}`);

    if (!testResults.identical) {
      // Save the data URLs to files for inspection
      const dataURLNearPath = path.join(
        PROJECT_ROOT,
        "far_canvas_near_focus_fixed.txt"
      );
      const dataURLFarPath = path.join(
        PROJECT_ROOT,
        "far_canvas_far_focus_fixed.txt"
      );

      fs.writeFileSync(dataURLNearPath, testResults.dataURLNear);
      fs.writeFileSync(dataURLFarPath, testResults.dataURLFar);

      console.log(`Saved Near Focus DataURL to: ${dataURLNearPath}`);
      console.log(`Saved Far Focus DataURL to: ${dataURLFarPath}`);

      // Also save as actual images for visual inspection
      const base64DataNear = testResults.dataURLNear.replace(
        /^data:image\/png;base64,/,
        ""
      );
      const base64DataFar = testResults.dataURLFar.replace(
        /^data:image\/png;base64,/,
        ""
      );

      const imagePathNear = path.join(
        PROJECT_ROOT,
        "far_canvas_near_focus_fixed.png"
      );
      const imagePathFar = path.join(
        PROJECT_ROOT,
        "far_canvas_far_focus_fixed.png"
      );

      fs.writeFileSync(imagePathNear, base64DataNear, "base64");
      fs.writeFileSync(imagePathFar, base64DataFar, "base64");

      console.log(`Saved Near Focus image to: ${imagePathNear}`);
      console.log(`Saved Far Focus image to: ${imagePathFar}`);
    }

    // This is the actual test - far-canvas should produce identical results regardless of focus
    expect(testResults.identical).toBe(true);
  }, 90000);
});
