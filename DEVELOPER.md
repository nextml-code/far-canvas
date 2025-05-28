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

1. **Transform-Aware** (primary): Uses native Canvas transforms (`setTransform`)
2. **Coordinate Transform** (fallback): Manually transforms each coordinate

The transform-aware approach is preferred because:

- Leverages native Canvas optimizations
- Supports all transform functions (rotate, scale, translate)
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
│   └── implementation-validation.test.js # Implementation consistency
├── example/              # Usage examples
├── static/               # Static assets
├── package.json          # NPM configuration
├── PLAN.md              # Transform implementation plan
├── COMPARE.md           # Implementation comparison
└── EXPLANATION.md       # How the library works
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

### Property Scaling

Properties that represent distances/sizes are scaled:

- `lineWidth`
- `shadowOffsetX/Y`
- `lineDashOffset`
- `font` size
- `miterLimit`

Properties that are NOT scaled:

- `shadowBlur` (remains in screen pixels)
- Colors, styles, composite operations
- Angles (for arcs, rotation)

## Testing Strategy

### Test Categories

1. **Unit Tests** (`test.js`)

   - Test individual method transformations
   - Verify property scaling
   - Check edge cases

2. **Visual Comparison** (`visual-comparison.test.js`)

   - Pixel-by-pixel comparison with vanilla Canvas
   - Tolerance for antialiasing differences
   - Validates rendering accuracy

3. **Bug Detection** (`bug-detection.test.js`)

   - Regression tests for specific bugs
   - Ensures fixes remain working

4. **Transform Support** (`transform-support.test.js`)
   - Verifies detection of transform capabilities
   - Tests both implementation paths

### Test Tolerances

Visual tests allow some pixel differences due to:

- Antialiasing variations
- Rasterization differences at different scales
- Floating-point precision in transforms

Typical tolerances:

- Exact match for simple shapes at origin
- 5% pixel difference for scaled content
- Full tolerance (255) for dash patterns

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

Handle both cases in font getter/setter.

### 4. Method Signatures

Some methods have optional parameters that must be preserved:

```javascript
arc(x, y, radius, startAngle, endAngle, counterclockwise);
// counterclockwise is optional but must be passed through
```

### 5. Special Methods

- `clearCanvas()`: Custom method that clears entire canvas
- `canvasDimensions`: Property that returns viewport bounds in world coordinates
- `s`: Legacy coordinate transformation helpers

## Things Initially Missed

1. **Transform Application Order**: First attempt had the transform order backwards, causing incorrect rendering.

2. **Offset Interpretation**: Initially misunderstood offset as a translation delta rather than viewport position.

3. **Arc Counterclockwise Parameter**: Wasn't passing through the optional 6th parameter.

4. **Filter Property**: Added later - newer Canvas property for CSS filters.

5. **8-argument drawImage**: Source rectangle variant needed separate handling.

6. **Test Expectations**: Many tests had expectations based on the wrong coordinate transformation formula.

## Known Limitations

1. **Path2D**: Not implemented - would require wrapping Path2D objects
2. **measureText**: Not implemented - would need TextMetrics wrapping
3. **getImageData/putImageData**: Not implemented - complex coordinate mapping
4. **createPattern**: Not implemented - pattern transformation complexity
5. **isPointInPath/Stroke**: Not implemented - requires path tracking

## Performance Considerations

- Transform-aware implementation is faster (native transforms)
- Coordinate transform fallback has overhead on every draw call
- Matrix multiplication is optimized but still has cost
- Consider caching transformed coordinates for static scenes

## Future Improvements

1. **Path2D Support**: Wrap Path2D to transform path commands
2. **Complete TextMetrics**: Implement measureText with proper scaling
3. **ImageData Methods**: Handle pixel data transformation
4. **Pattern Support**: Transform patterns correctly
5. **WebGL Context**: Extend to support WebGL rendering
6. **Caching**: Add coordinate transformation caching
7. **Benchmarks**: Add performance benchmarks
8. **Browser Tests**: Add browser-specific test suite

## Debugging Tips

1. **Check Transform Mode**:

   ```javascript
   const supportsTransforms = typeof ctx.setTransform === "function";
   ```

2. **Verify Offset Behavior**:

   ```javascript
   // Drawing at offset position should appear at origin
   ctx.fillRect(offsetX, offsetY, 100, 100); // Should appear at (0, 0)
   ```

3. **Test Coordinate Transformation**:

   ```javascript
   console.log(ctx.s.x(worldX)); // Screen X
   console.log(ctx.s.inv.x(screenX)); // World X
   ```

4. **Compare Implementations**: Run same code with transform-aware and fallback to ensure consistency.

## Release Checklist

- [ ] All tests passing (133 tests)
- [ ] Visual comparison tests have appropriate tolerances
- [ ] Example code works correctly
- [ ] Documentation updated
- [ ] Version bumped in package.json
- [ ] CHANGELOG.md updated
- [ ] Build output generated in lib.cjs/

## Key Decisions & Rationale

1. **Transform-Aware as Primary**: Better performance and cleaner code
2. **Offset = Viewport Position**: More intuitive than translation delta
3. **Separate Test Files**: Easier to debug specific functionality
4. **Tolerance in Visual Tests**: Necessary for cross-platform compatibility
5. **Matrix Math Utilities**: Reusable and testable transform logic

## Contact & Resources

- Original concept: Based on solving Canvas precision issues at large coordinates
- Key insight: Canvas maintains precision near origin, so transform everything there
- Similar projects: Consider looking at map rendering libraries that solve similar problems

## Build Process

### Development

```bash
npm install      # Install dependencies
npm test         # Run all tests
npm run build    # Build CommonJS version (if configured)
```

### Dependencies

- **Production**: None! Zero runtime dependencies
- **Development**:
  - `jest`: Testing framework
  - `canvas`: Node.js Canvas implementation for tests
  - Build tools as configured in package.json

### Building for Distribution

The library is distributed as:

- ES modules (src/index.js)
- CommonJS (lib.cjs/index.js)

## Additional Implementation Notes

### Save/Restore State Management

The transform-aware implementation maintains a transform stack:

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
  }
}
```

### DOMMatrix Polyfill

For environments without DOMMatrix:

```javascript
const MatrixClass =
  typeof DOMMatrix !== "undefined"
    ? DOMMatrix
    : class {
        constructor(init) {
          if (Array.isArray(init) && init.length === 6) {
            [this.a, this.b, this.c, this.d, this.e, this.f] = init;
          }
        }
      };
```

### Gradient Coordinate Space

Gradients are created in user space, not screen space:

```javascript
// User provides world coordinates
ctx.createLinearGradient(x0, y0, x1, y1);
// These coordinates go through the same transform as drawing operations
```

### Edge Case: Transform with Zero Scale

Be careful with scale = 0:

```javascript
// This would make everything invisible
far(canvas, { x: 0, y: 0, scale: 0 });
```

### Clip Regions

Clip regions are also transformed:

```javascript
ctx.beginPath();
ctx.arc(worldX, worldY, radius, 0, Math.PI * 2);
ctx.clip(); // Clipping region is in world coordinates
```

## Common Use Cases

### 1. Map/GIS Applications

```javascript
// Viewport at GPS coordinates
const ctx = far(canvas, {
  x: -122.4194, // longitude
  y: 37.7749, // latitude
  scale: 100000, // zoom level
}).getContext("2d");
```

### 2. CAD/Technical Drawing

```javascript
// Working in millimeters at large coordinates
const ctx = far(canvas, {
  x: 1000000, // 1km offset
  y: 1000000,
  scale: 10, // 10 pixels per mm
}).getContext("2d");
```

### 3. Game Worlds

```javascript
// Large game world with camera
const ctx = far(canvas, {
  x: player.x - canvas.width / 2, // center on player
  y: player.y - canvas.height / 2,
  scale: zoomLevel,
}).getContext("2d");
```

## Validation & Quality Checks

### Before Committing

1. Run all tests: `npm test`
2. Check test coverage if available
3. Verify both implementation paths work
4. Test with extreme coordinates (> 1e9)
5. Ensure no console.log statements left

### Performance Testing

```javascript
// Simple benchmark
const iterations = 10000;
const start = performance.now();

for (let i = 0; i < iterations; i++) {
  ctx.fillRect(
    Math.random() * 1000 + offset,
    Math.random() * 1000 + offset,
    10,
    10
  );
}

console.log(`Time: ${performance.now() - start}ms`);
```

## Troubleshooting

### "Not supported" Errors

- Check if you're in fallback mode
- Fallback doesn't support: rotate, scale, translate, transform, setTransform

### Rendering Differences

- Check pixel tolerances in tests
- Verify coordinate transformation formula
- Compare transform-aware vs fallback output

### Performance Issues

- Profile matrix multiplications
- Consider caching static transforms
- Check if fallback mode is being used unnecessarily

## Contributing Guidelines

1. **Add tests first**: Write tests before implementing features
2. **Maintain compatibility**: Don't break existing API
3. **Document complex math**: Add comments for transformations
4. **Update CHANGELOG.md**: Document all changes
5. **Consider both paths**: Test transform-aware and fallback

## Version History Notes

- Initial version: Coordinate transformation only
- Transform support added: Major architecture change
- Fixed offset interpretation: Breaking change in coordinate system
- All tests now passing: 133 tests ensure reliability

Remember: The goal is pixel-perfect rendering at any coordinate, maintaining the exact Canvas 2D API while solving precision issues.
