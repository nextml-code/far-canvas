# Far Canvas

Render 2D canvas content at large coordinates with ease.

## The problem

When rendering 2D canvas content at large coordinates, you may experience issues with precision. For example, drawing a horizontal line from `(100_000_000, 0.5)` to `(100_000_001, 0.5)` may render a diagonal line, or no line at all.

## The solution

Far Canvas is a wrapper around the HTML5 2D canvas API that avoids precision issues at large coordinates.

## NEW: Transform Support

Far Canvas now supports all Canvas 2D transform operations! When running in a modern browser or environment with full Canvas 2D support, far-canvas will automatically use a Transform-Aware implementation that:

- ✅ Supports `translate()`, `rotate()`, `scale()`, `transform()`, `setTransform()`, and `resetTransform()`
- ✅ Supports `getTransform()` to retrieve the current transformation matrix
- ✅ Leverages hardware-accelerated native Canvas transforms for better performance
- ✅ Maintains the same precision guarantees for large coordinates
- ✅ Falls back gracefully to coordinate transformation when transforms aren't available

```javascript
import { far } from "@nextml/far-canvas";

const canvas = document.getElementById("myCanvas");
const ctx = far(canvas, {
  x: 100_000_000, // Render with huge coordinate offset
  y: 100_000_000,
  scale: 2,
}).getContext("2d");

// All transform operations now work!
ctx.save();
ctx.translate(50, 50);
ctx.rotate(Math.PI / 4);
ctx.scale(1.5, 1.5);
ctx.fillRect(-25, -25, 50, 50);
ctx.restore();

// Draw at world coordinates - far-canvas handles the offset
ctx.fillStyle = "red";
ctx.fillRect(100_000_000, 100_000_000, 100, 100);
```

## Quick Start

```javascript
import { far } from "@nextml/far-canvas";

const canvas = document.getElementById("myCanvas");

const myFarCanvas = far(canvas, {
  x: 100_000_000,
  y: 0,
  scale: 2,
});

const context = myFarCanvas.getContext("2d");

// This will be a horizontal line!
context.strokeStyle = "red";
context.beginPath();
context.moveTo(100_000_000, 0.5);
context.lineTo(100_000_001, 0.5);
context.stroke();
```

## Install

`npm install @nextml/far-canvas`

## Usage

### `far( canvas: HTMLCanvasElement, options?: FarCanvasOptions ): FarCanvas`

Creates a far canvas instance. Options are:

- `x`: The x offset to apply to all drawing operations (default: 0)
- `y`: The y offset to apply to all drawing operations (default: 0)
- `scale`: The scale to apply to all drawing operations (default: 1)

### `FarCanvas`

The far canvas instance has a single method:

- `getContext( '2d' )`: Returns a `FarCanvasRenderingContext2D`

### `FarCanvasRenderingContext2D`

The far canvas rendering context implements the full [`CanvasRenderingContext2D`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) interface, with the following additions:

- `clearCanvas()`: Clears the entire canvas (ignoring any transforms)
- `canvasDimensions`: Returns the dimensions of the canvas in the far coordinate system

When transform support is available (modern browsers), all transform methods work as expected. In fallback mode, the following methods will throw an error:

- `translate()`, `rotate()`, `scale()`, `transform()`, `setTransform()`, `resetTransform()`, `getTransform()`

## How it works

Far Canvas uses two approaches depending on the environment:

### Transform-Aware Mode (when `setTransform` is available)

Uses Canvas 2D's native transform matrix to efficiently handle large coordinate offsets:

- Applies a hybrid approach: coordinate transformation for far-canvas offset, native transforms for user operations
- All drawing operations transform coordinates in JavaScript to avoid precision issues
- Leverages hardware acceleration for user transforms when available
- Supports all transform operations seamlessly

### Fallback Mode (when transforms aren't supported)

Falls back to coordinate transformation:

- Intercepts all drawing calls and transforms coordinates before passing to the underlying context
- Ensures compatibility with older browsers or limited Canvas implementations
- Transform operations are not supported in this mode

The appropriate mode is automatically selected based on feature detection.

## License

Apache-2.0
