const { far } = require("../lib.cjs/index.js");
const { createCanvas } = require("canvas");

describe("Implementation validation", () => {
  test("transform-aware and fallback produce same visual output", () => {
    const width = 200;
    const height = 200;
    const offsetX = 50;
    const offsetY = 30;
    const scale = 2;

    // Force fallback mode by using a mock without setTransform
    const fallbackCanvas = createCanvas(width, height);
    const fallbackMockCtx = fallbackCanvas.getContext("2d");
    delete fallbackMockCtx.setTransform; // Remove setTransform to force fallback

    const fallbackFarCanvas = {
      width,
      height,
      getContext: () => fallbackMockCtx,
    };

    const fallbackCtx = far(fallbackFarCanvas, {
      x: offsetX,
      y: offsetY,
      scale,
    }).getContext("2d");

    // Transform-aware mode (normal canvas has setTransform)
    const transformCanvas = createCanvas(width, height);
    const transformCtx = far(transformCanvas, {
      x: offsetX,
      y: offsetY,
      scale,
    }).getContext("2d");

    // Draw the same scene on both
    const drawScene = (ctx) => {
      // White background
      ctx.fillStyle = "white";
      ctx.fillRect(
        -offsetX / scale,
        -offsetY / scale,
        width / scale,
        height / scale
      );

      // Red rectangle at world coordinates (60, 40)
      ctx.fillStyle = "red";
      ctx.fillRect(60, 40, 30, 20);

      // Blue circle at world coordinates (100, 80)
      ctx.fillStyle = "blue";
      ctx.beginPath();
      ctx.arc(100, 80, 15, 0, Math.PI * 2);
      ctx.fill();

      // Green line
      ctx.strokeStyle = "green";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(70, 50);
      ctx.lineTo(120, 90);
      ctx.stroke();
    };

    drawScene(fallbackCtx);
    drawScene(transformCtx);

    // Compare the actual canvas pixels
    const fallbackData = fallbackCanvas
      .getContext("2d")
      .getImageData(0, 0, width, height);
    const transformData = transformCanvas
      .getContext("2d")
      .getImageData(0, 0, width, height);

    let maxDiff = 0;
    let diffCount = 0;

    for (let i = 0; i < fallbackData.data.length; i++) {
      const diff = Math.abs(fallbackData.data[i] - transformData.data[i]);
      if (diff > 0) {
        diffCount++;
        maxDiff = Math.max(maxDiff, diff);
      }
    }

    console.log("Comparison between fallback and transform-aware:");
    console.log("Max pixel difference:", maxDiff);
    console.log("Different pixels:", diffCount);
    console.log(
      "Diff percentage:",
      ((diffCount / fallbackData.data.length) * 100).toFixed(2) + "%"
    );

    // They should produce nearly identical output
    expect(maxDiff).toBeLessThanOrEqual(5);
    expect(diffCount / fallbackData.data.length).toBeLessThan(0.01); // Less than 1% difference
  });

  test("far-canvas correctly handles large coordinate offsets", () => {
    const width = 200;
    const height = 200;
    const farX = 10000000; // 10 million
    const farY = 10000000;

    // Reference: draw at origin
    const refCanvas = createCanvas(width, height);
    const refCtx = refCanvas.getContext("2d");
    refCtx.fillStyle = "red";
    refCtx.fillRect(50, 50, 60, 40);

    // Far canvas: draw at far coordinates
    const farCanvas = createCanvas(width, height);
    const farCtx = far(farCanvas, { x: farX, y: farY, scale: 1 }).getContext(
      "2d"
    );
    farCtx.fillStyle = "red";
    farCtx.fillRect(farX + 50, farY + 50, 60, 40);

    // Compare pixels
    const refData = refCanvas
      .getContext("2d")
      .getImageData(0, 0, width, height);
    const farData = farCanvas
      .getContext("2d")
      .getImageData(0, 0, width, height);

    let identical = true;
    for (let i = 0; i < refData.data.length; i++) {
      if (refData.data[i] !== farData.data[i]) {
        identical = false;
        break;
      }
    }

    expect(identical).toBe(true);
  });

  test("transform operations work correctly when supported", () => {
    const width = 200;
    const height = 200;

    const canvas = createCanvas(width, height);
    const ctx = far(canvas, { x: 0, y: 0, scale: 1 }).getContext("2d");

    // Check if transform operations are supported
    const supportsTransforms =
      typeof canvas.getContext("2d").setTransform === "function";

    if (supportsTransforms) {
      // Should not throw
      expect(() => {
        ctx.save();
        ctx.translate(50, 50);
        ctx.rotate(Math.PI / 4);
        ctx.scale(1.5, 1.5);
        ctx.fillStyle = "red";
        ctx.fillRect(-10, -10, 20, 20);
        ctx.restore();
      }).not.toThrow();

      // Should be able to get transform
      const transform = ctx.getTransform();
      expect(transform).toBeDefined();
    } else {
      // Should throw in fallback mode
      expect(() => ctx.translate(10, 10)).toThrow();
      expect(() => ctx.rotate(Math.PI)).toThrow();
      expect(() => ctx.scale(2, 2)).toThrow();
    }
  });
});
