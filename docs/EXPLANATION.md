# Far-Canvas Library Explanation

## Overview

Far-canvas is a JavaScript library designed to solve rendering problems that occur when drawing on HTML Canvas at extreme coordinate positions (e.g., millions of pixels away from the origin). It acts as a wrapper around the standard Canvas 2D API to enable accurate rendering at any coordinate position.

## The Problem

When using vanilla Canvas 2D API with large translations (e.g., 100 million pixels from origin), several rendering issues occur:
- Images, rectangles, and lines become misaligned
- Line widths render incorrectly
- General precision loss in rendering operations

This happens because browsers use floating-point arithmetic for canvas transformations, and floating-point precision degrades at very large numbers.

## How Far-Canvas Works

### Core Concept

Far-canvas solves this by maintaining a coordinate transformation system that:
1. Keeps the actual canvas rendering near the origin (where floating-point precision is highest)
2. Translates between "world coordinates" (where your objects logically exist) and "canvas coordinates" (where they're actually rendered)

### Architecture

#### 1. Transform Parameters
The library accepts three transform parameters:
- `x`: Horizontal translation offset
- `y`: Vertical translation offset  
- `scale`: Scaling factor

#### 2. Coordinate System (`s`)
The library creates a coordinate system object with transformation functions:

```javascript
s = {
  x: (x) => scale * (x + offset.x),      // World to canvas X
  y: (y) => scale * (y + offset.y),      // World to canvas Y
  distance: (d) => d * scale,            // Scale distances
  inv: {                                 // Inverse transformations
    x: (x) => x / scale - offset.x,     // Canvas to world X
    y: (y) => y / scale - offset.y,     // Canvas to world Y
    distance: (d) => d / scale           // Unscale distances
  }
}
```

#### 3. Method Wrapping
All Canvas 2D methods are wrapped to apply transformations:
- Position-based methods (e.g., `fillRect`, `moveTo`) transform x/y coordinates
- Size-based methods transform width/height/radius values
- Methods like `fillText` and `strokeText` handle both position and optional max width
- Properties like `lineWidth`, `font size`, and shadow offsets are scaled appropriately

#### 4. Special Features

**clearCanvas()**: A custom method that clears the entire canvas regardless of transformations

**canvasDimensions**: Provides the visible canvas area in world coordinates

**Unsupported Operations**: Transform methods like `scale()`, `translate()`, `rotate()`, `setTransform()` are intentionally not supported to prevent conflicts with the library's own transformation system

### Usage Pattern

```javascript
// Create a far context with large translation
const context = far(canvas, { y: -100000000, scale: 2 }).getContext("2d");

// Draw at world coordinates - internally rendered near origin
context.fillRect(0, 100000000, 100, 100);  // Rectangle at y=100M

// Access coordinate system for custom calculations
const canvasX = context.s.x(worldX);
const worldX = context.s.inv.x(canvasX);
```

## Implementation Details

### Property Handling
- **Read properties**: Values are retrieved from the underlying context and inverse-transformed
- **Write properties**: Values are transformed before being set on the underlying context
- **Font handling**: Special parsing to extract and scale font size while preserving style and family

### Method Categories

1. **Simple wrapped methods**: `save()`, `restore()`, `beginPath()`, etc. - passed through directly
2. **Position methods**: `moveTo()`, `lineTo()`, etc. - transform x/y coordinates
3. **Rectangle methods**: `fillRect()`, `clearRect()`, etc. - transform x/y and dimensions
4. **Arc methods**: `arc()`, `ellipse()` - transform center and radii
5. **Gradient methods**: Transform all coordinate parameters
6. **Not implemented**: Methods requiring `Path2D`, `ImageData`, or complex transformations

### Testing Strategy

The test suite verifies:
- Coordinate transformation correctness (forward and inverse)
- Method parameter transformation
- Property getter/setter behavior
- Proper delegation to underlying canvas context
- Error handling for unsupported operations

## Benefits

1. **Precision**: Maintains rendering accuracy at any coordinate position
2. **Compatibility**: Works as a drop-in replacement for standard Canvas 2D context
3. **Simplicity**: Transparent coordinate transformation without manual calculations
4. **Performance**: Minimal overhead - just arithmetic operations on method calls

## Limitations

1. Some Canvas 2D API methods not yet implemented (Path2D, ImageData operations)
2. Canvas transformation methods (scale, rotate, translate) are disabled
3. Text metrics not yet supported
4. Pattern creation not implemented

## Use Cases

- Large-scale mapping applications
- Infinite canvas implementations  
- Scientific visualization with extreme scales
- Games with vast world coordinates
- Any application requiring precise rendering far from origin 