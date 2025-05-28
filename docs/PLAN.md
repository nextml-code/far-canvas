# Plan for Supporting Transform Functions in Far-Canvas

## Current Situation

Far-canvas currently throws "not supported" errors for:

- `ctx.setTransform(a, b, c, d, e, f)`
- `ctx.translate(x, y)`
- `ctx.scale(x, y)`

These are disabled because they would conflict with far-canvas's core transformation system that maintains precision at large coordinates.

## The Challenge

Far-canvas works by:

1. Accepting world coordinates (potentially very large)
2. Transforming them to canvas coordinates near the origin
3. Applying a scale and offset to achieve this

If we allow arbitrary user transforms, they could:

- Move rendering back to large coordinates, defeating the purpose
- Create confusion about coordinate spaces
- Break the precision guarantees

## Potential Solutions

### Option 1: Transform Composition (Recommended)

**Concept**: Compose user transforms with far-canvas transforms mathematically.

**Implementation**:

```javascript
// Internal state
const userTransform = {
  matrix: [1, 0, 0, 1, 0, 0], // identity matrix [a, b, c, d, e, f]
  // Tracks user's transforms separately
};

// When user calls translate(x, y):
translate(x, y) {
  // Update user transform matrix
  userTransform.matrix = multiplyMatrix(
    userTransform.matrix,
    [1, 0, 0, 1, x, y]
  );
}

// When transforming coordinates:
s = {
  x: (x) => {
    // First apply user transform
    const [x1, y1] = applyMatrix(userTransform.matrix, [x, y]);
    // Then apply far-canvas transform
    return d.scale * (x1 + d.x);
  },
  // Similar for y, distance
}
```

**Pros**:

- Maintains full Canvas API compatibility
- User transforms work as expected
- Precision is maintained (transforms happen in world space first)

**Cons**:

- More complex implementation
- Need matrix math utilities
- Performance overhead

### Option 2: Transform Interception

**Concept**: Intercept transform calls and convert them to far-canvas operations.

**Implementation**:

```javascript
translate(x, y) {
  // Instead of translating canvas, adjust far-canvas offset
  d.x -= x;
  d.y -= y;
}

scale(x, y) {
  if (x !== y) {
    throw new Error("Non-uniform scaling not supported");
  }
  // Adjust far-canvas scale
  d.scale *= x;
}

setTransform(a, b, c, d, e, f) {
  if (b !== 0 || c !== 0) {
    throw new Error("Rotation/skew not supported");
  }
  // Extract scale and translation
  d.scale = a; // assuming uniform scale
  d.x = -e / a;
  d.y = -f / d;
}
```

**Pros**:

- Simple implementation
- Maintains precision guarantees
- No performance overhead

**Cons**:

- Limited functionality (no rotation, skew, non-uniform scale)
- Doesn't match standard Canvas behavior exactly
- Could surprise users

### Option 3: Hybrid Approach (Most Practical)

**Concept**: Support simple transforms via interception, complex ones via composition.

**Implementation**:

```javascript
class FarContext2D {
  constructor() {
    this.userScale = { x: 1, y: 1 };
    this.userTranslate = { x: 0, y: 0 };
    this.hasComplexTransform = false;
    this.transformMatrix = [1, 0, 0, 1, 0, 0];
  }

  translate(x, y) {
    if (this.hasComplexTransform) {
      // Use matrix composition
      this.transformMatrix = compose(this.transformMatrix, [1, 0, 0, 1, x, y]);
    } else {
      // Simple case - just track translation
      this.userTranslate.x += x * this.userScale.x;
      this.userTranslate.y += y * this.userScale.y;
    }
  }

  scale(x, y) {
    if (x !== y || this.hasComplexTransform) {
      // Switch to complex transform mode
      this.hasComplexTransform = true;
      this.transformMatrix = compose(this.transformMatrix, [x, 0, 0, y, 0, 0]);
    } else {
      // Simple uniform scale
      this.userScale.x *= x;
      this.userScale.y *= y;
    }
  }

  setTransform(a, b, c, d, e, f) {
    if (b !== 0 || c !== 0 || a !== d) {
      // Complex transform with rotation/skew
      this.hasComplexTransform = true;
      this.transformMatrix = [a, b, c, d, e, f];
    } else {
      // Simple transform
      this.hasComplexTransform = false;
      this.userScale = { x: a, y: d };
      this.userTranslate = { x: e, y: f };
    }
  }

  // Coordinate transformation
  transformPoint(x, y) {
    if (this.hasComplexTransform) {
      [x, y] = applyMatrix(this.transformMatrix, [x, y]);
    } else {
      x = x * this.userScale.x + this.userTranslate.x;
      y = y * this.userScale.y + this.userTranslate.y;
    }
    // Then apply far-canvas transform
    return {
      x: d.scale * (x + d.x),
      y: d.scale * (y + d.y),
    };
  }
}
```

**Pros**:

- Good performance for common cases
- Full compatibility when needed
- Graceful degradation

**Cons**:

- More complex implementation
- Two code paths to maintain

### Option 4: Documentation-Only Approach

**Concept**: Keep transforms unsupported but provide clear patterns for achieving similar effects.

**Documentation**:

```javascript
// Instead of ctx.translate(100, 50)
const offsetCtx = far(canvas, {
  x: existingX - 100,
  y: existingY - 50,
  scale: existingScale,
});

// Instead of ctx.scale(2, 2)
const scaledCtx = far(canvas, {
  x: existingX,
  y: existingY,
  scale: existingScale * 2,
});

// For complex transforms, render to an intermediate canvas
const tempCanvas = document.createElement("canvas");
const tempCtx = tempCanvas.getContext("2d");
// Apply transforms to tempCtx, render scene
tempCtx.setTransform(a, b, c, d, e, f);
// ... draw to tempCtx ...
// Then draw tempCanvas to far-canvas
farCtx.drawImage(tempCanvas, x, y);
```

**Pros**:

- No implementation needed
- Keeps library simple
- Maintains precision guarantees

**Cons**:

- Poor developer experience
- Not a true Canvas API replacement

## Recommendation

I recommend **Option 3: Hybrid Approach** because:

1. **Maintains precision**: The far-canvas transform is always applied last, keeping actual rendering near origin
2. **Good compatibility**: Most common use cases (translate, uniform scale) work efficiently
3. **Full capability**: Complex transforms are supported when needed via matrix math
4. **Performance**: Simple cases remain fast, complex cases are possible
5. **Progressive enhancement**: Can start with simple support and add complex later

## Implementation Steps

1. **Phase 1**: Support simple translate and uniform scale

   - Track user translation and scale
   - Modify coordinate transformation functions
   - Update all method implementations

2. **Phase 2**: Add matrix support for complex transforms

   - Implement matrix multiplication utilities
   - Add transform matrix tracking
   - Switch to matrix mode for complex cases

3. **Phase 3**: Full setTransform support
   - Parse and validate transform parameters
   - Handle all edge cases
   - Comprehensive testing

## Potential Issues

1. **Save/restore complexity**: Need to track transform stack
2. **getTransform**: Would need to compose matrices to return current transform
3. **resetTransform**: Need to clear user transforms while maintaining far-canvas transform
4. **Performance**: Matrix operations add overhead
5. **Testing**: Many more edge cases to test

## Alternative: Transform-Aware Far-Canvas

Another approach would be to make far-canvas transform-aware from the start:

```javascript
// Create far canvas with initial transform
const farCtx = far(canvas, {
  x: 1000000,
  y: 1000000,
  scale: 2,
  transform: [1, 0, 0, 1, 0, 0], // optional user transform
});

// All transforms would be composed with this base transform
farCtx.translate(50, 50); // Works as expected
farCtx.scale(2, 2); // Works as expected
farCtx.setTransform(a, b, c, d, e, f); // Replaces user transform, keeps far offset
```

This would be cleaner but requires more significant refactoring.

## Conclusion

Supporting transform functions is definitely possible and would improve API compatibility. The hybrid approach offers the best balance of performance, compatibility, and implementation complexity. However, it's a significant undertaking that would require careful implementation and extensive testing to ensure precision is maintained in all cases.
