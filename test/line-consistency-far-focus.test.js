const { far } = require("../lib.cjs/index.js");
const { createCanvas } = require("canvas");

describe("Line Rendering Consistency Test (Far Focus vs. Near Focus)", () => {
  const SCALE = 2.1875; // From example
  const FOCUS_NEAR = 5000;
  const FOCUS_FAR = 500000000;

  const CANVAS_WIDTH = 200;
  const CANVAS_HEIGHT = 100;

  // Line properties (in world units, to be scaled by canvas transform)
  const LINE_X_START_WORLD = 10;
  const LINE_X_END_WORLD = 190;
  const LINE_Y_OFFSET_WORLD = 50; // Y position of the line relative to the current focus point
  const LINE_WIDTH_WORLD = 8;

  function drawLineOnCanvas(ctx, currentFocusValue) {
    ctx.clearCanvas(); // Clear with transparent (or can set white if preferred)
    // Or, if clearCanvas is not robust enough for some reason or to be explicit:
    // ctx.fillStyle = 'white';
    // const inv = ctx.s.inv;
    // ctx.fillRect(inv.x(0), inv.y(0), CANVAS_WIDTH / SCALE, CANVAS_HEIGHT / SCALE);

    ctx.beginPath();
    ctx.moveTo(LINE_X_START_WORLD, currentFocusValue + LINE_Y_OFFSET_WORLD);
    ctx.lineTo(LINE_X_END_WORLD, currentFocusValue + LINE_Y_OFFSET_WORLD);

    ctx.lineWidth = LINE_WIDTH_WORLD;
    ctx.strokeStyle = "black"; // Use a solid color for easy comparison
    ctx.stroke();
  }

  test("a single line drawn on far-canvas should be identical between near and far focus points", () => {
    // 1. Setup Far Canvas (Near Focus)
    const farCanvasNearInstance = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    const farCtxNear = far(farCanvasNearInstance, {
      x: 0,
      y: FOCUS_NEAR,
      scale: SCALE,
    }).getContext("2d");

    // 2. Setup Far Canvas (Far Focus)
    const farCanvasFarInstance = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    const farCtxFar = far(farCanvasFarInstance, {
      x: 0,
      y: FOCUS_FAR,
      scale: SCALE,
    }).getContext("2d");

    // 3. Draw the same line scenario on both
    drawLineOnCanvas(farCtxNear, FOCUS_NEAR);
    drawLineOnCanvas(farCtxFar, FOCUS_FAR);

    // 4. Get Image Data
    const farNearData = farCanvasNearInstance
      .getContext("2d")
      .getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).data;
    const farFarData = farCanvasFarInstance
      .getContext("2d")
      .getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).data;

    // 5. Compare pixel data for exact match
    let firstDifferenceIndex = -1;
    for (let i = 0; i < farNearData.length; i++) {
      if (farNearData[i] !== farFarData[i]) {
        firstDifferenceIndex = i;
        break;
      }
    }

    if (firstDifferenceIndex !== -1) {
      console.log(
        `Pixel data differs starting at index ${firstDifferenceIndex}.`
      );
      console.log(
        `Near Value: ${farNearData[firstDifferenceIndex]}, Far Value: ${farFarData[firstDifferenceIndex]}`
      );
      // For easier debugging, save the images
      const fs = require("fs");
      fs.writeFileSync(
        "line_consistency_near.png",
        farCanvasNearInstance.toBuffer("image/png")
      );
      fs.writeFileSync(
        "line_consistency_far.png",
        farCanvasFarInstance.toBuffer("image/png")
      );
      console.log("Saved line consistency test images.");
    }

    expect(firstDifferenceIndex).toBe(-1); // Asserts that all pixel data is identical
  });
});
