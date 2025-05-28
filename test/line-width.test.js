const { far } = require("../lib.cjs/index.js");
const { createCanvas } = require("canvas");

describe("Line Width Discrepancy Test", () => {
  const FOCUS = 5000;
  const SCALE = 2.1875; // approx 700/320 from example.js
  const USER_LINE_WIDTH = 8;

  const CANVAS_WIDTH = 200;
  const CANVAS_HEIGHT = 200;
  const LINE_Y = 100; // Screen Y position to draw the horizontal line
  const LINE_X_START = 20;
  const LINE_X_END = 180;

  // Function to count non-white pixels in a vertical slice (to estimate thickness)
  function getLineThickness(ctx, canvasWidth, canvasHeight, atX) {
    const imageData = ctx.getImageData(atX - 1, 0, 3, canvasHeight); // Sample 3px wide strip
    let minEffectY = canvasHeight,
      maxEffectY = 0;
    let foundPixel = false;

    for (let y = 0; y < canvasHeight; y++) {
      for (let xOffset = 0; xOffset < 3; xOffset++) {
        const i = (y * 3 + xOffset) * 4;
        // Check if pixel is not white (or transparent white)
        if (
          imageData.data[i + 3] > 128 &&
          (imageData.data[i] < 250 ||
            imageData.data[i + 1] < 250 ||
            imageData.data[i + 2] < 250)
        ) {
          minEffectY = Math.min(minEffectY, y);
          maxEffectY = Math.max(maxEffectY, y);
          foundPixel = true;
        }
      }
    }
    if (!foundPixel) return 0;
    return maxEffectY - minEffectY + 1;
  }

  test("lineWidth should result in similar visual thickness on reference and far-canvas", () => {
    // 1. Setup Reference Canvas
    const refCanvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    const refCtx = refCanvas.getContext("2d");
    refCtx.scale(SCALE, SCALE); // Apply overall scale first
    // No translation needed as we draw line at a fixed screen Y for simplicity

    // 2. Setup Far Canvas
    const farCanvasInstance = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    // For this test, to isolate lineWidth, we use y:0 for far-canvas offset but maintain the scale
    const farCtx = far(farCanvasInstance, {
      x: 0,
      y: 0,
      scale: SCALE,
    }).getContext("2d");

    // 3. Render line on Reference Canvas
    refCtx.fillStyle = "white";
    refCtx.fillRect(0, 0, CANVAS_WIDTH / SCALE, CANVAS_HEIGHT / SCALE); // Clear
    refCtx.beginPath();
    refCtx.moveTo(LINE_X_START / SCALE, LINE_Y / SCALE);
    refCtx.lineTo(LINE_X_END / SCALE, LINE_Y / SCALE);
    refCtx.lineWidth = USER_LINE_WIDTH; // User sets 8px line width
    refCtx.strokeStyle = "black";
    refCtx.stroke();

    // 4. Render line on Far Canvas
    // Far canvas operates in world coordinates for drawing, but its effective transform handles the scale.
    farCtx.fillStyle = "white";
    farCtx.fillRect(0, 0, CANVAS_WIDTH / SCALE, CANVAS_HEIGHT / SCALE); // Clear in world coords
    farCtx.beginPath();
    // Draw line in world coordinates that will appear at the same screen position
    farCtx.moveTo(LINE_X_START / SCALE, LINE_Y / SCALE);
    farCtx.lineTo(LINE_X_END / SCALE, LINE_Y / SCALE);
    farCtx.lineWidth = USER_LINE_WIDTH; // User sets 8px line width
    farCtx.strokeStyle = "black";
    farCtx.stroke();

    // 5. Get visual thickness
    const refThickness = getLineThickness(
      refCanvas.getContext("2d"),
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      CANVAS_WIDTH / 2
    );
    const farThickness = getLineThickness(
      farCanvasInstance.getContext("2d"),
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      CANVAS_WIDTH / 2
    );

    console.log(
      `Reference Canvas line thickness: ${refThickness}px (Expected visual: ${
        USER_LINE_WIDTH * SCALE
      }px)`
    );
    console.log(
      `Far Canvas line thickness: ${farThickness}px (Expected visual: ${
        USER_LINE_WIDTH * SCALE
      }px)`
    );

    // Allow a small tolerance for anti-aliasing
    const thicknessTolerance = 2; // pixels for visual thickness

    expect(Math.abs(farThickness - refThickness)).toBeLessThanOrEqual(
      thicknessTolerance
    );

    // Also check if both are reasonably close to the expected visual thickness
    const expectedVisualThickness = USER_LINE_WIDTH * SCALE;
    expect(
      Math.abs(refThickness - expectedVisualThickness)
    ).toBeLessThanOrEqual(thicknessTolerance + 1); // Allow slightly more for node-canvas rendering
    expect(
      Math.abs(farThickness - expectedVisualThickness)
    ).toBeLessThanOrEqual(thicknessTolerance + 1);

    if (Math.abs(farThickness - refThickness) > thicknessTolerance) {
      const fs = require("fs");
      fs.writeFileSync(
        "reference_line_test.png",
        refCanvas.toBuffer("image/png")
      );
      fs.writeFileSync(
        "far_line_test.png",
        farCanvasInstance.toBuffer("image/png")
      );
      console.log(
        "Saved test images to reference_line_test.png and far_line_test.png"
      );
    }
  });
});
