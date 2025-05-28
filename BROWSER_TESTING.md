# Browser Testing Methodology for Far-Canvas

## Overview

This document describes the reliable automated testing approach developed for testing far-canvas rendering consistency between near and far focus in browser environments.

## Problem Statement

Initial attempts to test far-canvas using Puppeteer screenshots revealed significant challenges:

- Screenshot-based comparisons produced hundreds of mismatched pixels even for identical vanilla canvas renders
- Visual differences were inconsistent and unreliable for automated testing
- Manual inspection was required, defeating the purpose of automation

## Solution: Canvas.toDataURL() Comparison

We developed a robust testing methodology using `canvas.toDataURL()` for pixel-perfect comparison of canvas rendering output.

### Key Advantages

1. **Zero False Positives**: Identical canvas draws produce identical DataURLs
2. **Reliable Detection**: Clearly identifies actual rendering differences
3. **Automated Execution**: No manual intervention required
4. **Precise Measurement**: Exact byte-level comparison of canvas output
5. **Debugging Artifacts**: Automatically saves images when differences are detected

## Implementation

### Test Structure

The testing framework consists of:

1. **Browser Test Page** (`example/browser-test.html`): Contains test cases that run in the browser
2. **Puppeteer Test Script** (`test/browser-visual-consistency.test.js`): Orchestrates test execution and validation
3. **HTTP Server**: Serves the test page and far-canvas library to the browser

### Test Cases

#### Vanilla Canvas Sanity Check

```javascript
{
    name: "Vanilla Canvas Data URL Sanity Check",
    description: "Draws identical simple scenes on vanilla canvas and compares using canvas.toDataURL().",
    run: (canvas, params) => {
        const ctx = canvas.getContext('2d');

        const drawScene = () => {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'red';
            ctx.fillRect(10, 10, 50, 30);
        };

        // Draw scene 1
        drawScene();
        const dataURL1 = canvas.toDataURL();

        // Clear and draw scene 2 (identical)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawScene();
        const dataURL2 = canvas.toDataURL();

        // Compare data URLs
        const identical = dataURL1 === dataURL2;

        return {
            pass: identical,
            details: `DataURL comparison: ${identical ? 'IDENTICAL' : 'DIFFERENT'}`
        };
    }
}
```

#### Far-Canvas Consistency Test

```javascript
{
    name: "Far-Canvas Data URL Comparison",
    description: "Tests far-canvas rendering consistency between near and far focus using canvas.toDataURL().",
    run: (canvas, params) => {
        const FOCUS_NEAR = 5000;
        const FOCUS_FAR = 500000000;

        const drawTestScene = (ctx, focus) => {
            ctx.clearCanvas();
            // Draw test elements (rectangle, line, text)
            // ...
        };

        // Test near focus
        const ctxNear = far(canvas, { x: params.x, y: FOCUS_NEAR, scale: params.scale }).getContext('2d');
        drawTestScene(ctxNear, FOCUS_NEAR);
        const dataURLNear = canvas.toDataURL();

        // Test far focus
        const ctxFar = far(canvas, { x: params.x, y: FOCUS_FAR, scale: params.scale }).getContext('2d');
        drawTestScene(ctxFar, FOCUS_FAR);
        const dataURLFar = canvas.toDataURL();

        // Compare
        const identical = dataURLNear === dataURLFar;

        return {
            pass: identical,
            details: `Near vs Far focus rendering: ${identical ? 'IDENTICAL' : 'DIFFERENT'}`
        };
    }
}
```

### Puppeteer Integration

The Puppeteer script:

1. Starts an HTTP server to serve test files
2. Launches a browser and navigates to the test page
3. Executes specific test cases
4. Retrieves DataURL comparison results from the browser
5. Saves debugging artifacts (images, DataURLs) when tests fail
6. Performs Jest assertions on the results

```javascript
// Get the test results
const testResults = await page.evaluate(() => window.farCanvasDataURLTest);

console.log(`Near focus DataURL length: ${testResults.lengthNear}`);
console.log(`Far focus DataURL length: ${testResults.lengthFar}`);
console.log(`DataURLs identical: ${testResults.identical}`);

// Save debugging artifacts if different
if (!testResults.identical) {
  // Save DataURLs as text files
  fs.writeFileSync("far_canvas_near_focus.txt", testResults.dataURLNear);
  fs.writeFileSync("far_canvas_far_focus.txt", testResults.dataURLFar);

  // Save as PNG images for visual inspection
  const base64DataNear = testResults.dataURLNear.replace(
    /^data:image\/png;base64,/,
    ""
  );
  const base64DataFar = testResults.dataURLFar.replace(
    /^data:image\/png;base64,/,
    ""
  );

  fs.writeFileSync("far_canvas_near_focus.png", base64DataNear, "base64");
  fs.writeFileSync("far_canvas_far_focus.png", base64DataFar, "base64");
}

// Assert identical rendering
expect(testResults.identical).toBe(true);
```

## Test Results

### Validation Results

- **Vanilla Canvas Sanity Check**: ✅ PASSED (DataURLs identical: true)
- **Far-Canvas Consistency Test**: ❌ FAILED (DataURLs identical: false)
  - Near focus (5000) DataURL length: 3890
  - Far focus (500000000) DataURL length: 1694

### Debugging Artifacts

When tests fail, the following files are automatically generated:

- `far_canvas_near_focus.png` - Visual output at near focus
- `far_canvas_far_focus.png` - Visual output at far focus
- `far_canvas_near_focus.txt` - Complete DataURL for near focus
- `far_canvas_far_focus.txt` - Complete DataURL for far focus

## Running Tests

```bash
# Run the browser consistency test
npm test test/browser-visual-consistency.test.js
```

## Benefits

1. **Deterministic**: Same input always produces same output
2. **Sensitive**: Detects even minor rendering differences
3. **Fast**: No image processing or pixel comparison needed
4. **Debuggable**: Provides clear artifacts for investigation
5. **Maintainable**: Simple string comparison logic

## Future Enhancements

- Add tests for individual rendering primitives (rectangles, lines, text separately)
- Test different scale factors and focus distances
- Add performance benchmarking
- Integrate with CI/CD pipeline for regression detection

## Conclusion

The `canvas.toDataURL()` methodology provides a robust, reliable foundation for automated testing of canvas rendering consistency. It eliminates the noise and unreliability of screenshot-based approaches while providing precise, actionable results for debugging rendering issues.
