const { far } = require("../lib.cjs/index.js");
const { createCanvas } = require("canvas");

describe("Consistency Across Focus Points Test", () => {
  const SCALE = 2.1875;
  const FOCUS_NEAR = 5000;
  const FOCUS_FAR = 500000000;

  const CANVAS_WIDTH = 150;
  const CANVAS_HEIGHT = 150;

  // Define scene elements in a shared "world space" relative to a conceptual origin for the scene itself.
  // These are dimensions and positions *before* any focus offset is applied.
  const sceneElements = {
    redRect: { x: 10, y: 10, w: 50, h: 50, color: "#FF0000" }, // These are intended screen pixels after SCALE
    blueCircle: { x: 75, y: 75, r: 20, color: "#0000FF" }, // Intended screen pixels after SCALE
    greenLine: { x1: 10, y1: 120, x2: 130, y2: 20, lw: 5, color: "#00FF00" }, // Intended screen pixels after SCALE
  };

  // Draw scene using world coordinates that will map to the sceneElements spec.
  function drawScene(ctx, currentFocusValue, isReference = false) {
    // Clear background to white
    if (isReference) {
      ctx.fillStyle = "white";
      // refCtx is already scaled and translated. (0,0) is its top-left for the focused content.
      ctx.fillRect(0, 0, CANVAS_WIDTH / SCALE, CANVAS_HEIGHT / SCALE);
    } else {
      ctx.clearCanvas(); // Use far-canvas own clear method
      // If not available, ensure proper world coords for fillRect based on current far-canvas offset
      // For example: ctx.fillRect(ctx.s.inv.x(0), ctx.s.inv.y(0), CANVAS_WIDTH/SCALE, CANVAS_HEIGHT/SCALE);
    }

    const SE = sceneElements; // Shorthand

    // Red square: Draw at (SE.redRect.x / SCALE, currentFocusValue + SE.redRect.y / SCALE)
    // with world dimensions (SE.redRect.w / SCALE, SE.redRect.h / SCALE)
    ctx.fillStyle = SE.redRect.color;
    ctx.fillRect(
      SE.redRect.x / SCALE,
      currentFocusValue + SE.redRect.y / SCALE,
      SE.redRect.w / SCALE,
      SE.redRect.h / SCALE
    );

    // Blue circle
    ctx.fillStyle = SE.blueCircle.color;
    ctx.beginPath();
    ctx.arc(
      SE.blueCircle.x / SCALE,
      currentFocusValue + SE.blueCircle.y / SCALE,
      SE.blueCircle.r / SCALE,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Green line
    ctx.strokeStyle = SE.greenLine.color;
    ctx.lineWidth = SE.greenLine.lw / SCALE; // Set line width in world units
    ctx.beginPath();
    ctx.moveTo(
      SE.greenLine.x1 / SCALE,
      currentFocusValue + SE.greenLine.y1 / SCALE
    );
    ctx.lineTo(
      SE.greenLine.x2 / SCALE,
      currentFocusValue + SE.greenLine.y2 / SCALE
    );
    ctx.stroke();
  }

  function compareImageDatas(data1, data2, canvasName1, canvasName2) {
    let differentPixels = 0;
    let maxDiff = 0;
    for (let i = 0; i < data1.data.length; i += 4) {
      // Check only one component per pixel for speed, or all
      for (let j = 0; j < 3; ++j) {
        // R, G, B
        const diff = Math.abs(data1.data[i + j] - data2.data[i + j]);
        if (diff > 20) {
          // Increased tolerance for minor AA rendering differences
          differentPixels++;
          maxDiff = Math.max(maxDiff, diff);
          // break; // Count pixel as different once, not for each channel
        }
      }
      // Alpha channel can also differ slightly
      const alphaDiff = Math.abs(data1.data[i + 3] - data2.data[i + 3]);
      if (alphaDiff > 20) {
        differentPixels++; // Counting differing pixels rather than components
        maxDiff = Math.max(maxDiff, alphaDiff);
      }
    }
    // To count differing pixels (not components), we need a different approach:
    let differingPixelCount = 0;
    for (let i = 0; i < data1.data.length; i += 4) {
      if (
        Math.abs(data1.data[i] - data2.data[i]) > 20 ||
        Math.abs(data1.data[i + 1] - data2.data[i + 1]) > 20 ||
        Math.abs(data1.data[i + 2] - data2.data[i + 2]) > 20 ||
        Math.abs(data1.data[i + 3] - data2.data[i + 3]) > 20
      ) {
        differingPixelCount++;
      }
    }
    differentPixels = differingPixelCount; // Use the pixel count

    console.log(`Comparison: ${canvasName1} vs ${canvasName2}`);
    console.log(
      `- Differing pixels (tolerance 20): ${differentPixels} out of ${
        data1.data.length / 4
      }`
    );
    console.log(`- Max difference in single RGBA component: ${maxDiff}`);
    return { differentPixels, maxDiff };
  }

  test("far-canvas rendering should be consistent across different focus points and match reference at near focus", () => {
    // 1. Setup Reference Canvas (Near Focus)
    const refCanvasNear = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    const refCtxNear = refCanvasNear.getContext("2d");
    refCtxNear.scale(SCALE, SCALE);
    refCtxNear.translate(0, -FOCUS_NEAR);

    // 2. Setup Far Canvas (Near Focus)
    const farCanvasNearInstance = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    const farCtxNear = far(farCanvasNearInstance, {
      x: 0,
      y: FOCUS_NEAR,
      scale: SCALE,
    }).getContext("2d");

    // 3. Setup Far Canvas (Far Focus)
    const farCanvasFarInstance = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    const farCtxFar = far(farCanvasFarInstance, {
      x: 0,
      y: FOCUS_FAR,
      scale: SCALE,
    }).getContext("2d");

    // 4. Draw scenes
    drawScene(refCtxNear, FOCUS_NEAR, true);
    drawScene(farCtxNear, FOCUS_NEAR, false);
    drawScene(farCtxFar, FOCUS_FAR, false);

    // 5. Get Image Data
    const refNearData = refCanvasNear
      .getContext("2d")
      .getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const farNearData = farCanvasNearInstance
      .getContext("2d")
      .getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const farFarData = farCanvasFarInstance
      .getContext("2d")
      .getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 6. Comparisons
    const comparison1 = compareImageDatas(
      refNearData,
      farNearData,
      "Reference (Near)",
      "Far Canvas (Near)"
    );
    expect(comparison1.differentPixels).toBeLessThanOrEqual(
      CANVAS_WIDTH * CANVAS_HEIGHT * 0.01
    ); // Allow 1% of pixels to differ slightly
    expect(comparison1.maxDiff).toBeLessThanOrEqual(25); // Max component difference

    const comparison2 = compareImageDatas(
      farNearData,
      farFarData,
      "Far Canvas (Near)",
      "Far Canvas (Far)"
    );
    expect(comparison2.differentPixels).toBeLessThanOrEqual(
      CANVAS_WIDTH * CANVAS_HEIGHT * 0.01
    );
    expect(comparison2.maxDiff).toBeLessThanOrEqual(25);

    const significantPixelDifferenceThreshold =
      Math.floor(CANVAS_WIDTH * CANVAS_HEIGHT * 0.01) + 1;
    if (
      comparison1.differentPixels > significantPixelDifferenceThreshold ||
      comparison2.differentPixels > significantPixelDifferenceThreshold
    ) {
      const fs = require("fs");
      fs.writeFileSync(
        "consistency_ref_near.png",
        refCanvasNear.toBuffer("image/png")
      );
      fs.writeFileSync(
        "consistency_far_near.png",
        farCanvasNearInstance.toBuffer("image/png")
      );
      fs.writeFileSync(
        "consistency_far_far.png",
        farCanvasFarInstance.toBuffer("image/png")
      );
      console.log("Saved consistency test images.");
    }
  });
});
