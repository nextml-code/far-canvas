const { far } = require("../lib.cjs/index.js");
const { createCanvas } = require("canvas");

describe("Text Scaling Discrepancy for 'example' text", () => {
  const FOCUS = 5000;
  const SCALE = 2.1875; // approx 700/320 from example.js
  const TEXT_CONTENT = "example";
  // FONT_STYLE is intentionally NOT set here to use default/initial font
  const TEXT_X = 10;
  const TEXT_Y_OFFSET = 10; // Relative to rectangle.y, which is focus + 20 in example
  const RECT_Y_IN_WORLD = FOCUS + 20;

  const CANVAS_WIDTH = 400; // Increased canvas size for safety
  const CANVAS_HEIGHT = 150;

  // Helper function to get the bounding box of non-white pixels
  function getBoundingBox(ctx, canvasWidth, canvasHeight) {
    const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    let minX = canvasWidth,
      minY = canvasHeight,
      maxX = 0,
      maxY = 0;
    let foundPixel = false;

    for (let y = 0; y < canvasHeight; y++) {
      for (let x = 0; x < canvasWidth; x++) {
        const i = (y * canvasWidth + x) * 4;
        if (
          imageData.data[i + 3] > 128 &&
          (imageData.data[i] < 250 ||
            imageData.data[i + 1] < 250 ||
            imageData.data[i + 2] < 250)
        ) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
          foundPixel = true;
        }
      }
    }
    if (!foundPixel)
      return {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        details: "No non-white pixels found",
      };
    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    };
  }

  test("'example' text (fillText, default font) should have similar bounding box on reference and far-canvas at focus=5000", () => {
    // 1. Setup Reference Canvas
    const refCanvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    const refCtx = refCanvas.getContext("2d");
    refCtx.scale(SCALE, SCALE);
    refCtx.translate(0, -RECT_Y_IN_WORLD + TEXT_Y_OFFSET); // Adjust translation to center the text area

    // 2. Setup Far Canvas
    const farCanvasInstance = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    const farCtx = far(farCanvasInstance, {
      x: 0,
      y: RECT_Y_IN_WORLD - TEXT_Y_OFFSET,
      scale: SCALE,
    }).getContext("2d");

    // 3. Render text on Reference Canvas
    // Default font is 10px sans-serif (from canvas spec) or what node-canvas defaults to.
    // Far-canvas initializes to 10px (world) * scale (screen).
    refCtx.fillStyle = "white";
    refCtx.fillRect(
      0,
      RECT_Y_IN_WORLD - TEXT_Y_OFFSET,
      CANVAS_WIDTH / SCALE,
      CANVAS_HEIGHT / SCALE
    ); // Clear background relative to its current transform
    refCtx.fillStyle = "black";
    // For reference, draw at world coords, its transform handles visibility.
    refCtx.fillText(TEXT_CONTENT, TEXT_X, RECT_Y_IN_WORLD);

    // 4. Render text on Far Canvas
    farCtx.fillStyle = "white";
    // For farCtx, fillRect uses world coordinates; its offset handles mapping to screen.
    // We want to clear the area where text will appear on screen. So map screen 0,0 to world.
    const invFar = farCtx.s.inv; // Get inverse transform helpers
    farCtx.fillRect(
      invFar.x(0),
      invFar.y(0),
      CANVAS_WIDTH / SCALE,
      CANVAS_HEIGHT / SCALE
    );
    farCtx.fillStyle = "black";
    // fillText also takes world coordinates for farCtx
    farCtx.fillText(TEXT_CONTENT, TEXT_X, RECT_Y_IN_WORLD);

    // 5. Get Bounding Boxes from the raw screen pixels
    const refBox = getBoundingBox(
      refCanvas.getContext("2d"),
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );
    const farBox = getBoundingBox(
      farCanvasInstance.getContext("2d"),
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );

    console.log(
      `Reference Canvas - '${TEXT_CONTENT}' (default font) bounding box: w=${refBox.width}, h=${refBox.height}, x=${refBox.x}, y=${refBox.y}`
    );
    console.log(
      `Far Canvas       - '${TEXT_CONTENT}' (default font) bounding box: w=${farBox.width}, h=${farBox.height}, x=${farBox.x}, y=${farBox.y}`
    );
    if (refBox.details) console.log("RefBox details: ", refBox.details);
    if (farBox.details) console.log("FarBox details: ", farBox.details);

    const dimensionTolerance = 8; // Increased tolerance a bit for default font rendering

    expect(refBox.width).toBeGreaterThan(5); // Make sure text rendered
    expect(farBox.width).toBeGreaterThan(5);

    expect(Math.abs(farBox.width - refBox.width)).toBeLessThanOrEqual(
      dimensionTolerance
    );
    expect(Math.abs(farBox.height - refBox.height)).toBeLessThanOrEqual(
      dimensionTolerance
    );

    if (
      Math.abs(farBox.width - refBox.width) > dimensionTolerance ||
      Math.abs(farBox.height - refBox.height) > dimensionTolerance
    ) {
      const fs = require("fs");
      fs.writeFileSync(
        "reference_example_text_test.png",
        refCanvas.toBuffer("image/png")
      );
      fs.writeFileSync(
        "far_example_text_test.png",
        farCanvasInstance.toBuffer("image/png")
      );
      console.log(
        "Saved test images to reference_example_text_test.png and far_example_text_test.png"
      );
    }
  });
});
