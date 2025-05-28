# Developer Guide for far-canvas

## Project Overview

far-canvas is a JavaScript library that solves HTML5 Canvas rendering precision issues at extreme coordinates (e.g., 100 million pixels from origin). It wraps the Canvas 2D API to maintain floating-point precision by transforming coordinates to render near the origin.

## Architecture

### Core Concept

The library intercepts all Canvas 2D API calls and transforms coordinates using the formula:

```screen_coordinate = scale * (world_coordinate - offset)

```

Where:

- `offset` (x, y) represents the viewport position in world space
- `scale` is the zoom factor
- World coordinates are what the user provides
- Screen coordinates are what gets rendered

### Implementation Approaches

The library has two implementations:

1. **Transform-Aware** (primary): Uses native Canvas transforms (`setTransform`) for user transforms, coordinate transformation for far-canvas offset
2. **Coordinate Transform** (fallback): Manually transforms each coordinate

**CRITICAL IMPLEMENTATION DETAIL**: The transform-aware approach uses a **hybrid strategy** to avoid precision issues:

- **Far-canvas offset**: Handled via coordinate transformation in JavaScript (never passed to `setTransform`)
- **User transforms**: Applied via native Canvas `setTransform` (rotation, scaling, etc.)

This hybrid approach is essential because passing large translation values (e.g., -1,093,750,000 pixels) to the browser's native `setTransform()` method causes the same floating-point precision issues that far-canvas was designed to solve.

**Previous Broken Approach** (before fix):

```javascript
// WRONG: This passes massive values to setTransform, causing precision loss
const offsetTransform = multiplyMatrices(
  scaleMatrix(scale, scale),
  translateMatrix(-x, -y) // Could be -500,000,000!
);
_context.setTransform(
  offsetTransform.a,
  offsetTransform.b,
  offsetTransform.c,
  offsetTransform.d,
  offsetTransform.e,
  offsetTransform.f
);
```

**Current Correct Approach**:

```javascript
// CORRECT: Only user transforms go to setTransform, far-canvas offset handled in JS
const farTransform = {
  x: (worldX) => scale * (worldX - x), // Transform in JavaScript
  y: (worldY) => scale * (worldY - y),
  // ...
};
_context.setTransform(
  userTransform.a,
  userTransform.b,
  userTransform.c,
  userTransform.d,
  userTransform.e,
  userTransform.f
); // Only small values
```

The transform-aware approach is preferred because:

- Leverages native Canvas optimizations for user transforms
- Supports all transform functions (rotate, scale, translate)
- Avoids precision issues by keeping `setTransform` values small
- Cleaner architecture
- Better performance

## Project Structure

```
far-canvas/
├── src/
│   └── index.js          # Main library source
├── lib.cjs/              # CommonJS build output
├── test/
│   ├── test.js                      # Core unit tests
│   ├── transform-support.test.js    # Transform detection tests
│   ├── transform-verification.test.js # Transform behavior tests
│   ├── visual-comparison.test.js    # Pixel-perfect comparison tests
│   ├── bug-detection.test.js        # Regression tests
│   ├── implementation-validation.test.js # Implementation consistency
│   ├── text-scaling.test.js         # Tests for text rendering consistency
│   ├── line-width.test.js           # Tests for line width consistency
│   ├── example-scene-consistency.test.js # Compares full example scene at near/far focus (node-canvas)
│   └── browser-visual-consistency.test.js # Puppeteer tests for browser visual consistency
├── example/
│   ├── index.html                # Main example page
│   ├── example.js                # JS for main example
│   ├── browser-test.html         # HTML page for targeted browser tests
│   └── README.md                 # Explains how to use the examples
├── static/               # Static assets
├── package.json          # NPM configuration
├── babel.config.js       # Babel config for Jest ESM transforms
├── PLAN.md               # Transform implementation plan
├── COMPARE.md            # Implementation comparison
├── EXPLANATION.md        # How the library works
└── LEARNINGS.md          # Learnings from browser testing setup
```

## Code Style Guide

### General Principles

- Use descriptive variable names (e.g., `offsetTransform`, not `ot`)
- Keep functions focused and single-purpose
- Comment complex mathematical operations
- Use early returns to reduce nesting

### Specific Conventions

```javascript
// Matrix operations use descriptive names
const multiplyMatrices = (a, b) => { /* ... */ };
const createMatrix = (a, b, c, d, e, f) => { /* ... */ };

// Coordinate transformation uses clear naming
const transformPoint = (matrix, x, y) => { /* ... */ };
const transformDistance = (distance) => { /* ... */ };

// Properties follow Canvas API naming exactly
get lineWidth() { /* ... */ }
set lineWidth(width) { /* ... */ }
```

## Implementation Details

### Transform Matrices

The transform-aware implementation uses 2D affine transformation matrices:

```javascript
// Matrix format: [a, b, c, d, e, f]
// | a c e |   | x |   | ax + cy + e |
// | b d f | × | y | = | bx + dy + f |
// | 0 0 1 |   | 1 |   | 1           |
```

Key matrices:

- `offsetTransform`: Moves viewport to origin and applies scale
- `userTransform`: User's custom transforms (rotate, scale, etc.)
- `combinedTransform`: offsetTransform × userTransform

### Coordinate System

**Important**: The offset represents where the viewport is positioned in world space, not a translation amount.

Example:

- Offset: `{x: 1000000, y: 1000000}`
- Drawing at world `(1000050, 1000050)` appears at screen `(50, 50)`

### Property Scaling (Transform-Aware Mode)

In the transform-aware mode (`getTransformAwareContext`), properties that represent distances/sizes are generally **not** scaled by the individual property setters/getters. Instead, the user provides these values in _world units_, and the main canvas transform (`_context.setTransform(...)`), which includes the overall `scale`, handles their visual scaling.

- **Examples (set/get in world units):** `lineWidth`, `fontSize` (in `font` string), `lineDashOffset`, `miterLimit`, `shadowOffsetX`, `shadowOffsetY`.
- **Methods with dimensioned arguments (e.g., `createImageData(width, height, ...)`):** If the underlying canvas API expects screen units for these arguments, `far-canvas` scales the world-unit arguments provided by the user before passing them to the native method.
- **Methods returning arrays of dimensioned values (e.g., `getLineDash()`):** Values returned by the native canvas API (in screen units) are un-scaled by `far-canvas` before being returned to the user in world units.

Properties that are NOT scaled by `far-canvas` mechanisms include:

- `shadowBlur` (remains in screen pixels, as per Canvas API standard behavior with transforms)
- Colors, styles, composite operations
- Angles (for arcs, rotation)

This approach avoids double-scaling issues where both the property wrapper and the main canvas transform might scale a value.

## Testing Strategy

### Test Categories

1. **Unit Tests** (`test.js`)

   - Test individual method transformations (primarily for the fallback context).
   - Verify property scaling (primarily for the fallback context).
   - Check edge cases.

2. **Visual Comparison** (`visual-comparison.test.js`)

   - Pixel-by-pixel comparison with vanilla Canvas using `node-canvas`.
   - Tolerance for antialiasing differences.
   - Validates rendering accuracy at moderate coordinates.

3. **Bug Detection** (`bug-detection.test.js`)

   - Regression tests for specific bugs using `node-canvas`.

4. **Transform Support** (`transform-support.test.js`)

   - Verifies detection of transform capabilities.
   - Tests both implementation paths using `node-canvas`.

5. **Specific Feature Consistency** (`text-scaling.test.js`, `line-width.test.js`)

   - Focused tests using `node-canvas` to verify fixes for specific properties like `font` and `lineWidth` after identifying double-scaling issues.

6. **Node-Canvas Scene Consistency** (`example-scene-consistency.test.js`)

   - Renders a complex scene (mocking `example.js`) on `far-canvas` at near and far focus points using `node-canvas`.
   - Asserts pixel-perfect identity to confirm internal consistency of `far-canvas` logic across different offsets in the `node-canvas` environment.

7. **Browser Visual Consistency (Puppeteer)** (`browser-visual-consistency.test.js`)

   - Uses Puppeteer to launch a headless Chrome browser.
   - Loads `example/browser-test.html` via a local HTTP server (spun up by the test).
   - Automates interaction with `browser-test.html` to render specific scenarios on two `far-canvas` instances: one with a near focus offset, one with a far focus offset.
   - Takes screenshots of these browser-rendered canvases and uses `pixelmatch` to compare them.
   - This is crucial for detecting browser-specific rendering discrepancies at extreme coordinates that `node-canvas` tests might miss.

### Limitations of `node-canvas` for Extreme Coordinates

While `node-canvas` (based on Cairo) is excellent for unit testing core logic, consistency, and behavior at typical coordinate ranges, it may not fully replicate browser rendering artifacts that occur at extreme coordinate offsets (e.g., > 10^9). Issues like vanishing elements, subtle distortions due to floating-point precision limits within browser rendering engines (e.g., Skia, WebKit), or GPU acceleration nuances are best caught in actual browsers.

Therefore, direct visual inspection and automated browser tests are critical for validating `far-canvas` under these extreme conditions.

### Browser-Based Testing Approach

- **Manual Inspection (`example/browser-test.html`)**: This HTML page provides a suite of test cases that can be run directly in any browser. It allows for interactive testing with different parameters (offset, scale) and visual inspection of `far-canvas` behavior for specific rendering tasks (lines, text, complex scenes). This is invaluable for initial diagnosis of browser-specific issues.
- **Automated Puppeteer Tests (`test/browser-visual-consistency.test.js`)**: As described above, this automates the comparison of `far-canvas` renderings at near vs. far focus points within a headless Chrome environment. Challenges in this setup included:
  - Handling ES Module dependencies (like `pixelmatch`) within Jest via Babel configuration (`babel.config.js`, `transformIgnorePatterns`).
  - Reliably serving local HTML files to Puppeteer (resolved by using a simple Node.js `http` server within the test script itself instead of `file://` URLs).
  - Synchronizing Puppeteer with the page's JavaScript execution, especially for ES modules and `DOMContentLoaded` events (resolved by waiting for specific function availability like `typeof window.runSelectedTests === 'function'`).

### Test Tolerances

Visual tests using `node-canvas` and Puppeteer allow some pixel differences due to:

- Antialiasing variations between rendering engines or even slightly different setups.
- Minor rasterization differences at different scales or offsets.
- Floating-point precision nuances in transforms that might lead to 1-pixel shifts.

Typical tolerances:

- Exact match (0 different pixels) for simple shapes at origin or for internal consistency tests of `far-canvas` at different offsets in `node-canvas`.
- Small percentage of differing pixels (e.g., <1-2%) or a small maximum component difference (e.g., <25 out of 255) for browser-based visual diffing or complex scenes where anti-aliasing is a factor.
- Full tolerance (255) for dash patterns in some `node-canvas` tests due to known rendering variations.

## Common Pitfalls & Gotchas

### 1. Coordinate System Confusion

**Wrong**: Thinking offset is added to coordinates

```javascript
// Incorrect mental model
screen = scale * (world + offset);
```

**Right**: Offset is subtracted (viewport position)

```javascript
// Correct
screen = scale * (world - offset);
```

### 2. Transform Order Matters

The combined transform must be: `offset × user`, not `user × offset`

```javascript
// Correct order
combinedTransform = multiplyMatrices(offsetTransform, userTransform);
```

### 3. Font Parsing Edge Cases

Fonts can have 2 or 3 parts:

- "16px Arial" → ["16px", "Arial"]
- "bold 16px Arial" → ["bold", "16px", "Arial"]

Handle both cases in font getter/setter (especially in the fallback context).

### 4. Method Signatures

Some methods have optional parameters that must be preserved:

```javascript
arc(x, y, radius, startAngle, endAngle, counterclockwise);
// counterclockwise is optional but must be passed through
```

### 5. Special Methods

- `clearCanvas()`: Custom method that clears entire canvas, ignoring current `far-canvas` transform and applying identity to clear the screen.
- `canvasDimensions`: Property that returns viewport bounds in world coordinates.
- `s`: Legacy coordinate transformation helpers (primarily used by fallback context).

### 6. Double Scaling of Properties

In the transform-aware mode, if a property that represents a dimension (e.g., `lineWidth`, `fontSize`) is scaled by its setter _and_ the main canvas context is also scaled (via `setTransform`), the visual result will be scaled twice.
**Solution**: Property setters should store the unscaled world value. The main canvas transform handles visual scaling. Getters should unscale the retrieved value if necessary to return it in world units.

## Things Initially Missed

1. **Transform Application Order**: First attempt had the transform order backwards, causing incorrect rendering.
2. **Offset Interpretation**: Initially misunderstood offset as a translation delta rather than viewport position.
3. **Arc Counterclockwise Parameter**: Wasn't passing through the optional 6th parameter.
4. **Filter Property**: Added later - newer Canvas property for CSS filters.
5. **8-argument drawImage**: Source rectangle variant needed separate handling.
6. **Test Expectations**: Many tests had expectations based on the wrong coordinate transformation formula.
7. **Double Scaling of `lineWidth` and `font`**: Initial transform-aware implementation scaled these in setters, leading to visual inconsistencies when combined with the main context scale. Fixed by storing world-units and letting the main transform handle visual scaling.
8. **Initial Default Font/LineWidth Scaling**: The `_context.font` and `_context.lineWidth` were also initially pre-scaled during `far-canvas` context initialization, causing issues for default-styled elements. Fixed to initialize with world-unit defaults.
9. **CRITICAL: Large Translation Values in setTransform**: The original transform-aware implementation passed massive translation values (e.g., -1,093,750,000 pixels) directly to the browser's `setTransform()` method, causing the same precision issues far-canvas was designed to solve. This was discovered through automated browser testing using `canvas.toDataURL()` comparison, which showed identical vanilla canvas renders but different far-canvas renders at extreme coordinates. Fixed by using a hybrid approach: coordinate transformation for far-canvas offset, native transforms only for user transforms.
10. **Browser Testing Methodology**: Initially relied on screenshot-based comparison with Puppeteer, which produced hundreds of false positive mismatches even for identical renders. Solved by switching to `canvas.toDataURL()` comparison, which provides pixel-perfect, deterministic results with zero false positives.

## Known Limitations

1. **Path2D**: Not implemented - would require wrapping Path2D objects and transforming their internal commands.
2. **measureText**: Not implemented - would need TextMetrics wrapping and proper scaling of returned metrics.
3. **getImageData/putImageData**: Not implemented - complex coordinate mapping and scaling considerations for pixel data.
4. **createPattern**: Not implemented - pattern transformation complexity.
5. **isPointInPath/Stroke**: Not implemented - requires path tracking and transformation of test points.

## Performance Considerations

- Transform-aware implementation is faster (native transforms).
- Coordinate transform fallback has overhead on every draw call.
- Matrix multiplication is optimized but still has cost.
- Consider caching transformed coordinates for static scenes.

## Future Improvements

1. **Path2D Support**: Wrap Path2D to transform path commands.
2. **Complete TextMetrics**: Implement `measureText` with proper scaling.
3. **ImageData Methods**: Handle pixel data transformation.
4. **Pattern Support**: Transform patterns correctly.
5. **WebGL Context**: Extend to support WebGL rendering (major undertaking).
6. **Caching**: Add coordinate transformation caching for performance.
7. **Benchmarks**: Add performance benchmarks, especially comparing transform-aware vs. fallback, and performance at extreme offsets.
8. **Browser Test Suite Enhancement**: Continuously improve `browser-test.html` and Puppeteer tests to cover more complex scenarios and rendering features.

## Debugging Tips

1. **Check Transform Mode**:

```javascript
const supportsTransforms =
  typeof canvas.getContext("2d").setTransform === "function";
// In your far-canvas context, you can also check if it's the transform-aware or fallback version.
```

2. **Verify Offset Behavior**:

```javascript
// Drawing at offset position should appear at origin on the canvas
ctx.fillRect(offsetX, offsetY, 100, 100); // Should appear at screen (0,0) if scale is 1
```

3. **Test Coordinate Transformation (Fallback context)**:

```javascript
console.log(ctx.s.x(worldX)); // Screen X
console.log(ctx.s.inv.x(screenX)); // World X
```

4. **Compare Implementations**: Run same code with transform-aware and fallback (if possible to force) to ensure consistency for supported features.

5. **Puppeteer Debugging for Browser Tests**:
   - Set `headless: false` in Puppeteer launch options to visually inspect the browser.
   - Use `page.on('console')`, `page.on('pageerror')`, `page.on('requestfailed')`, `page.on('response')` to pipe browser activity to the Jest console.
   - When tests fail, save screenshots and HTML content (`await page.content()`) for inspection.
   - Use `browser-test.html` for manual, interactive debugging in the target browser before automating with Puppeteer.
   - Be mindful of ES module scoping and timing when using `page.waitForFunction`.

## Release Checklist

- [ ] All `node-canvas` tests passing (Jest).
- [ ] Puppeteer visual consistency tests (`test/browser-visual-consistency.test.js`) passing.
- [ ] Manual verification of key scenarios in `example/browser-test.html` across target browsers.
- [ ] Visual comparison tests (`visual-comparison.test.js`) have appropriate tolerances.
- [ ] Example code (`example/example.js`, `example/index.html`) works correctly and clearly demonstrates features/fixes.
- [ ] Documentation updated (README, DEVELOPER.md, example/README.md).
- [ ] Version bumped in `package.json`.
- [ ] `CHANGELOG.md` updated.
- [ ] Build output generated in `lib.cjs/` and `lib.web/`.

## Key Decisions & Rationale

1. **Transform-Aware as Primary**: Better performance and cleaner code, supports all native canvas transforms.
2. **Offset = Viewport Position**: More intuitive than interpreting offset as a translation delta.
3. **Separate Test Files**: Easier to manage and debug specific functionalities (e.g., text scaling, line width, browser consistency).
4. **Tolerance in Visual Tests**: Necessary for antialiasing, minor rasterization differences across platforms/engines.
5. **Matrix Math Utilities**: Reusable and testable transform logic.
6. **World Units for Properties**: In transform-aware mode, properties like `lineWidth` and `fontSize` are set/get in world units to avoid double scaling.

## Contact & Resources

- Original concept: Based on solving Canvas precision issues at large coordinates.
- Key insight: Canvas maintains precision near origin, so transform everything there.
- Similar projects: Consider looking at map rendering libraries that solve similar problems (e.g., Leaflet, OpenLayers, Mapbox GL JS).

## Build Process

### Development

```bash
npm install      # Install dependencies
npm test         # Run all tests (Jest, node-canvas)
# To run specific puppeteer test: npm test test/browser-visual-consistency.test.js
npm run example  # Serves the example/index.html page for browser viewing
```

### Dependencies

- **Production**: None! Zero runtime dependencies.
- **Development**:
  - `jest`: Testing framework.
  - `canvas`: Node.js Canvas implementation (Cairo-backed) for tests.
  - `puppeteer`: For headless Chrome testing.
  - `pixelmatch`, `pngjs`: For image comparison in Puppeteer tests.
  - `finalhandler`, `serve-static`: For the simple HTTP server in Puppeteer tests.
  - `rollup`: For bundling.
  - `live-server`: For serving examples.
  - `babel-jest`, `@babel/core`, `@babel/preset-env`: For Jest to handle ES Modules from dependencies.

### Building for Distribution

The library is distributed as:

- ES modules (`src/index.js` - this is the source, typically bundled by users)
- CommonJS (`lib.cjs/index.js` - for Node.js environments)
- IIFE/UMD (`lib.web/index.js` - for direct browser `<script>` tag usage, named `far`)

## Additional Implementation Notes

### Save/Restore State Management

The transform-aware implementation maintains a transform stack for `userTransform` and `combinedTransform` to correctly handle `save()` and `restore()` calls in conjunction with the native canvas save/restore.

```javascript
const transformStack = [];

save() {
  _context.save();  // Native save
  transformStack.push({
    userTransform: { ...userTransform },
    combinedTransform: { ...combinedTransform }
  });
}

restore() {
  _context.restore();  // Native restore
  if (transformStack.length > 0) {
    const state = transformStack.pop();
    userTransform = state.userTransform;
    combinedTransform = state.combinedTransform;
    // No need to call applyTransform() here as the native restore handles the transform matrix stack
  }
}
```

### DOMMatrix Polyfill (for `getTransform`)

For environments without `DOMMatrix` (used by `getTransform()` in transform-aware mode):

```javascript
const MatrixClass =
  typeof DOMMatrix !== "undefined"
    ? DOMMatrix
    : class {
        // Simple polyfill for matrix structure
        constructor(init) {
          if (Array.isArray(init) && init.length === 6) {
            [this.a, this.b, this.c, this.d, this.e, this.f] = init;
          } else {
            // Ensure default identity if no init
            this.a = 1;
            this.b = 0;
            this.c = 0;
            this.d = 1;
            this.e = 0;
            this.f = 0;
          }
        }
        // Add other DOMMatrix methods if needed by users of getTransform(), e.g., multiply, inverse
        // For now, it primarily returns the state.
      };
```

### Gradient Coordinate Space (Transform-Aware Mode)

- **Current:** `createLinearGradient`, `createRadialGradient`, `createConicGradient` in transform-aware mode pass coordinates directly to `_context` methods. This is problematic at large offsets as the gradient definition itself becomes huge, leading to precision loss or unexpected rendering (e.g., solid colors). This was identified as a bug.
- **Required Fix:** These methods should transform the user-provided world coordinates for the gradient definition into the screen space (i.e., the coordinate system of the underlying `_context` _after_ `offsetTransform` has been applied via `setTransform` but _before_ any `userTransform` is considered for the gradient itself). This is subtle because gradients are usually defined in the current user space.
  Alternatively, if gradients are meant to be in the _final screen space after all transforms_, then the coordinates need to be transformed by the `combinedTransform`.
  The most common expectation is that gradient coordinates are relative to the current user transform, just like shape coordinates. If `far-canvas` is abstracting away the `offsetTransform`, then gradient coordinates provided by the user (in world space) should effectively be transformed by `userTransform` only, relative to the `offsetTransform` base. This is complex.
  The simplest fix for the observed bug (gradients becoming solid at large offsets) is to ensure the gradient is defined in a coordinate space that makes sense for the visible canvas area. If the underlying `_context` is already transformed by `offsetTransform` (to bring the world origin near screen origin), then defining the gradient using world coordinates directly (as currently done) _should_ work IF the browser handles large coordinate inputs to `create...Gradient` methods robustly after its CTM is set. The bug implies it does not.
  Therefore, gradient coordinates probably need to be transformed from world to the _local space of the canvas before user transforms_ but _after the main far-canvas offset and scale_. This is equivalent to transforming them by `offsetTransform`.

  ```javascript
  // Proposed fix for createLinearGradient in Transform-Aware mode:
  createLinearGradient(x0, y0, x1, y1) {
    const p0 = transformPoint(offsetTransform, x0, y0);
    const p1 = transformPoint(offsetTransform, x1, y1);
    return _context.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
  }
  // Similar for radial and conic gradients.
  ```

### Edge Case: Transform with Zero Scale

Be careful with `scale = 0` passed to `far()`:

```javascript
// This would make everything invisible and could lead to division by zero in getters.
far(canvas, { x: 0, y: 0, scale: 0 });
```

Consider adding a check or warning for `scale = 0` during initialization.

### Clip Regions

Clip regions are defined by paths, and those path coordinates are in world space. The native `clip()` operation will use the current transform, so this should work correctly without special handling for clip path coordinates themselves.

## Common Use Cases

### 1. Map/GIS Applications

```javascript
// Viewport at GPS coordinates
const ctx = far(canvas, {
  x: -122.4194, // longitude (world X)
  y: 37.7749, // latitude (world Y)
  scale: 100000, // zoom level
}).getContext("2d");
```

### 2. CAD/Technical Drawing

```javascript
// Working in millimeters at large coordinates
const ctx = far(canvas, {
  x: 1000000, // 1km offset in mm (world X)
  y: 1000000, // (world Y)
  scale: 10, // 10 pixels per mm
}).getContext("2d");
```

### 3. Game Worlds

```javascript
// Large game world with camera centered on player
const ctx = far(canvas, {
  x: player.worldX - canvas.width / (2 * zoomLevel), // Center viewport X on player
  y: player.worldY - canvas.height / (2 * zoomLevel), // Center viewport Y on player
  scale: zoomLevel,
}).getContext("2d");
```

## Validation & Quality Checks

### Before Committing

1. Run all tests: `npm test`
2. If visual tests (Puppeteer) are configured, ensure they pass: `npm test test/browser-visual-consistency.test.js`
3. Manually check `example/index.html` and `example/browser-test.html` in target browsers, especially with extreme coordinates (> 1e9).
4. Ensure no `console.log` statements are left in production code (`src/index.js`).

### Performance Testing (Manual Example)

```javascript
// Simple benchmark in browser console with far-canvas context (ctx)
const iterations = 10000;
const offsetX = ctx.canvasDimensions.x; // Assuming canvasDimensions gives current world offset
const offsetY = ctx.canvasDimensions.y;

const start = performance.now();
for (let i = 0; i < iterations; i++) {
  ctx.fillRect(
    offsetX + Math.random() * 100, // Draw near current view
    offsetY + Math.random() * 100,
    10,
    10
  );
}
console.log(
  `fillRect time for ${iterations} ops: ${performance.now() - start}ms`
);
```

## Troubleshooting

### "Not supported" Errors

- Check if you're in fallback mode (`typeof ctx.setTransform !== 'function'` on the _underlying_ context passed to `far()`).
- Fallback doesn't support: `rotate`, `scale`, `translate`, `transform`, `setTransform`, `getTransform`, `resetTransform`.

### Rendering Differences / Artifacts in Browser (vs. Node-Canvas or vs. Near Focus)

- **Lines not straight / vanishing / wrong thickness at far focus**: Could be browser engine precision limits with large coordinate inputs to native calls _before_ `far-canvas` transform fully resolves to screen. Or, if `lineWidth` handling in `far-canvas` is incorrect.
- **Text vanishing / wrong size at far focus**: Check `font` property handling (setter/getter, initialization) for double-scaling. Also, browser engine limits for `fillText` with huge pre-transform coordinates.
- **Gradients incorrect at far focus**: Gradient coordinates are likely not being transformed correctly for the browser context. See "Gradient Coordinate Space" note.
- **Use `browser-test.html`**: This page is designed for isolated testing of features in the browser.
- **Puppeteer Tests**: `test/browser-visual-consistency.test.js` aims to catch these automatically. If it fails, check the saved `puppeteer_*.png` images.

### Performance Issues

- Profile matrix multiplications if custom transforms are heavily used.
- Consider if fallback mode is being used unnecessarily (e.g., if `setTransform` was inadvertently removed from a canvas prototype).

## Contributing Guidelines

1. **Add tests first**: Write tests (Jest/node-canvas for logic, Puppeteer/browser-test.html for visual browser behavior) before implementing features or fixing bugs.
2. **Maintain compatibility**: Don't break existing API without strong justification and version bumping.
3. **Document complex math**: Add comments for transformations.
4. **Update `CHANGELOG.md`**: Document all significant changes.
5. **Consider both paths**: Ensure changes to transform-aware context have corresponding considerations or tests for the fallback context if applicable.

## Version History Notes

- Initial version: Coordinate transformation only (fallback mode).
- Transform support added: Major architecture change, introduced transform-aware mode.
- Fixed offset interpretation: Breaking change in coordinate system meaning.
- Addressed double-scaling issues: For `font`, `lineWidth`, and other dimensioned properties in transform-aware mode.
- Ongoing: Improving browser visual consistency at extreme coordinates.

Remember: The goal is pixel-perfect rendering at any coordinate, maintaining the exact Canvas 2D API while solving precision issues.
