# Learnings & Challenges: Far-Canvas Browser Testing with Puppeteer

This document summarizes the debugging journey, issues encountered, and lessons learned while setting up automated browser-based visual consistency tests for the `far-canvas` library using Puppeteer.

## Initial Goal

To verify that `far-canvas` renders scenes consistently in a real browser (Chrome via Puppeteer) when using very large coordinate offsets (e.g., `focus = 500,000,000`) compared to smaller offsets (`focus = 5000`). This was prompted by user observations of visual discrepancies (vanishing text, shrinking lines) in the browser example that were not caught by existing `node-canvas` based Jest tests.

## Key Challenges & Debugging Steps

1.  **Puppeteer Test Setup (`test/browser-visual-consistency.test.js`)**:

    - **Initial Approach**: Load `example/browser-test.html` using `file://` protocol.
    - **Issue 1: ES Module Syntax Error (`pixelmatch`)**:
      - `pixelmatch` (and potentially other new dev dependencies) use ES module syntax (`export default`).
      - Jest (with its default Babel setup) failed to parse this.
      - **Fix Attempt 1**: Added `transformIgnorePatterns` in `package.json` for `pixelmatch`.
      - **Fix Attempt 2**: Explicitly added `"transform": {"^.+\\\.js$": "babel-jest", "^.+\\\.mjs$": "babel-jest"}` to Jest config.
      - **Fix Attempt 3 (Successful for ESM)**: Installed `babel-jest`, `@babel/core`, `@babel/preset-env` and created `babel.config.js` to ensure `node_modules` (specifically `pixelmatch`) are correctly transpiled.
    - **Issue 2: `net::ERR_FILE_NOT_FOUND` for `browser-test.html`**:
      - Puppeteer couldn't load the local HTML file even with seemingly correct absolute paths.
      - **Fix Attempt 1**: Made path resolution more explicit using `path.resolve(__dirname, "..")`.
      - **Fix Attempt 2**: Always launched Puppeteer with `--no-sandbox` locally.
      - **Fix Attempt 3**: Corrected script path inside `browser-test.html` from `./src/index.js` to `../src/index.js`.
      - **Underlying Cause Found**: The `browser-test.html` file was not in the `/example/` directory as assumed by the test path. It was in the project root. User moved the file to `/example/browser-test.html`.
      - **Issue 2b: Static Server 404s**: After moving the file, the simple `serve-static` based HTTP server in the Puppeteer test still failed to serve `/example/browser-test.html` (got 404).
      - **Fix Attempt 4 (Successful for serving files)**: Replaced `serve-static` with a manual HTTP server in the test, using `fs.readFile` for specific required paths (`/example/browser-test.html`, `/src/index.js`, `/package.json`). Added extensive logging.
    - **Issue 3: Puppeteer Timeout Waiting for Page Initialization (`window.testCases`, `window.runSelectedTests`)**:
      - Even after `browser-test.html` and `src/index.js` loaded successfully (HTTP 200), `page.waitForFunction` for globals defined in the HTML's module script would time out.
      - **Hypothesis**: ES module scoping issues or timing of global assignments.
      - **Fix Attempt 1**: Explicitly assigned `_testCases` and `_runSelectedTests` to `window.testCases` and `window.runSelectedTests` from within the module script in `browser-test.html`.
      - **Fix Attempt 2**: Simplified `DOMContentLoaded` in `browser-test.html` to primarily log and check for critical variables; removed auto-run of tests.
      - **Fix Attempt 3 (Successful for page readiness)**: Changed Puppeteer to wait for a DOM side-effect (`document.getElementById('specificTest').options.length > 1`) and then directly for `typeof window.runSelectedTests === 'function'` in `beforeAll`.
    - **Issue 4: Puppeteer Timeout Waiting for Dynamically Created Canvases (`#farCanvasNearFocusCompare`)**:
      - After successfully loading the page and triggering the in-page test logic, Puppeteer timed out waiting for the test case to append its canvases to the DOM.
      - **Current Status**: This is where we left off. The next step is to debug why the specific test case in `browser-test.html` ("Example Snippets (Near vs. Far Focus)") isn't adding its canvases when run by Puppeteer, or why Puppeteer can't see them. Adding more logs inside that specific test case's `run` function in `browser-test.html` is the immediate next step.

2.  **`far-canvas` Core Logic (via `node-canvas` tests)**:

    - **Initial Observation**: User noted that text and lines appeared to change size in the `example/index.html` when `focus` was varied.
    - **Text Scaling (`fillText`)**:
      - Identified that the `font` setter in `getTransformAwareContext` was scaling the font size, and then `setTransform` scaled it again (double scaling).
      - **Fix**: Modified `font` getter/setter to store and return unscaled font strings; the main transform handles visual scaling. Test `test/text-scaling.test.js` confirmed this fix for explicit font setting.
      - **Default Font**: Found that the initial `_context.font` set in `getTransformAwareContext` was also pre-scaling the default font size, leading to double scaling for text drawn before an explicit `ctx.font` change.
      - **Fix**: Changed `_context.font` initialization to use unscaled world values (e.g., `"10px sans-serif"`). Test `test/text-scaling.test.js` (adapted for default font) confirmed this.
    - **Line Width (`lineWidth`)**:
      - Similar double-scaling issue identified.
      - **Fix**: Modified `lineWidth` getter/setter to use unscaled world values. Test `test/line-width.test.js` confirmed this.
    - **Other Scaled Properties**: Systematically updated `lineDashOffset`, `miterLimit`, `shadowOffsetX/Y`, `setLineDash`, `getLineDash`, `createImageData` in `getTransformAwareContext` to follow the same principle: setters/getters use world values, methods transform arguments/results if the underlying context expects screen values.
    - **Consistency Tests (`node-canvas`)**:
      - `test/line-consistency-far-focus.test.js`: Showed a single line renders identically on `far-canvas` at near vs. far focus.
      - `test/example-scene-consistency.test.js`: Showed the _entire complex example scene_ (with mock image) renders identically on `far-canvas` at near vs. far focus.
      - **Conclusion from `node-canvas` tests**: The core `far-canvas` logic appears internally consistent and correctly handles scaling for various properties and operations _in the node-canvas environment_. Visual size of elements does not change with `focus` in these tests.

3.  **Browser-Specific Discrepancies**:
    - User observations from `example/index.html` (real browser) and `browser-test.html` (manual run) indicate that:
      - Simple horizontal lines can vanish or become heavily distorted at large focus values in the browser, even if `node-canvas` tests pass.
      - The "example" text (using default font) vanishes at `FOCUS_FAR` in the browser.
      - Other elements might shift position or change apparent size.
    - **This strongly points to differences in how browser rendering engines (e.g., Chrome/Skia) handle the transformed drawing commands or the large pre-transform coordinates compared to `node-canvas`/Cairo, despite `far-canvas`'s efforts.**

## Key Learnings

- **Browser vs. `node-canvas`**: `node-canvas` is invaluable for unit testing core logic but cannot be a complete substitute for testing visual rendering in actual browsers, especially when dealing with edge cases like extreme coordinate values and their interaction with browser rendering pipelines.
- **Puppeteer Setup for Local `file://` / ES Modules**: Can be tricky. Using a local HTTP server for tests is more robust than `file://` for pages with module scripts and relative paths.
- **ES Module Scope**: Variables (`const`, `let`, `function`) defined inside a `<script type="module">` are scoped to that module and not automatically global. Explicit assignment to `window` is needed if external scripts (like Puppeteer `waitForFunction`) need to access them.
- **Debugging Puppeteer Timeouts**: Often requires breaking down `waitForFunction` calls and adding extensive logging both in the Jest script (Puppeteer side) and in the browser page's JavaScript to pinpoint where initialization or execution is halting or failing.
- **Precision Issues are Subtle**: Double-scaling bugs (like for `font` and `lineWidth`) can easily creep in when a wrapper library tries to manage scaled properties on top of a canvas context that also applies its own transformations.
- **The Importance of Visual Inspection**: Automated pixel diffing is powerful, but direct visual inspection in the target environment (browser) is crucial for catching issues like vanishing elements that an automated test might miss if not perfectly tuned.

## Current Problem to Solve

The Puppeteer test (`test/browser-visual-consistency.test.js`) is still timing out, currently when waiting for the dynamically created canvases (`#farCanvasNearFocusCompare`) to appear. This indicates an issue within the execution of the "Example Snippets (Near vs. Far Focus)" test case _inside_ `browser-test.html` when triggered by Puppeteer.
