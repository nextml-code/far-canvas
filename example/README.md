# Far-Canvas Example

This example demonstrates how far-canvas maintains rendering precision at large coordinates where vanilla Canvas would typically show artifacts.

## How it Works

The example sets up two canvases side by side:

- **Left (green border)**: Reference canvas using vanilla Canvas API
- **Right (red border)**: Far-canvas implementation

Both canvases render the same content:

- Saturn images arranged vertically
- Yellow rectangles with text
- Various drawing operations (lines, text, fills)

## Key Variables

### `focus`

The vertical coordinate where content is positioned. Try different values:

- `0` - Normal rendering at origin
- `5000` - Small offset (currently set)
- `500000000` - Large offset where vanilla canvas breaks down

### How Viewport Works

- When `focus = 5000`, the viewport is positioned at `y = 5000`
- Content is drawn at `y = focus + offset` (e.g., `y = 5000 + 20`)
- The viewport now follows the content, keeping it visible

## Testing

1. Run the example:

   ```bash
   npm run example
   ```

2. Edit `focus` in `example.js` to test different coordinates:

   ```javascript
   const focus = 500000000; // Try this to see vanilla canvas artifacts
   ```

3. Compare the two canvases:
   - At small values (< 1 million), both should look identical
   - At large values (> 100 million), vanilla canvas may show:
     - Distorted shapes
     - Incorrect line positions
     - Missing content
   - Far-canvas should maintain correct rendering

## What to Look For

When testing with large coordinates, watch for these artifacts in vanilla canvas:

- Horizontal lines becoming diagonal
- Rectangles appearing in wrong positions
- Text rendering incorrectly
- General loss of precision

Far-canvas solves these issues by transforming coordinates to render near the origin while maintaining the illusion of rendering at extreme coordinates.
