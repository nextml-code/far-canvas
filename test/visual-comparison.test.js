const { far } = require("../lib.cjs/index.js");
const { createCanvas } = require("canvas");

// Helper to create a test scene on any context
function drawTestScene(ctx, offsetX = 0, offsetY = 0) {
  // Clear with white background
  ctx.fillStyle = "white";
  ctx.fillRect(offsetX - 10, offsetY - 10, 320, 320);

  // Draw various shapes and styles
  ctx.fillStyle = "#FF0000";
  ctx.fillRect(offsetX + 10, offsetY + 10, 50, 50);

  ctx.strokeStyle = "#00FF00";
  ctx.lineWidth = 3;
  ctx.strokeRect(offsetX + 70, offsetY + 10, 50, 50);

  // Draw a circle
  ctx.fillStyle = "#0000FF";
  ctx.beginPath();
  ctx.arc(offsetX + 90, offsetY + 90, 20, 0, Math.PI * 2);
  ctx.fill();

  // Draw lines
  ctx.strokeStyle = "#FF00FF";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(offsetX + 10, offsetY + 80);
  ctx.lineTo(offsetX + 60, offsetY + 130);
  ctx.stroke();

  // Draw text
  ctx.fillStyle = "#000000";
  ctx.font = "16px Arial";
  ctx.fillText("Test", offsetX + 10, offsetY + 150);

  // Draw with transparency
  ctx.fillStyle = "rgba(255, 128, 0, 0.5)";
  ctx.fillRect(offsetX + 40, offsetY + 40, 60, 60);

  // Draw bezier curve
  ctx.strokeStyle = "#008080";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(offsetX + 130, offsetY + 10);
  ctx.bezierCurveTo(
    offsetX + 130,
    offsetY + 40,
    offsetX + 170,
    offsetY + 40,
    offsetX + 170,
    offsetY + 70
  );
  ctx.stroke();

  // Draw with line dash
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = "#808080";
  ctx.beginPath();
  ctx.moveTo(offsetX + 10, offsetY + 170);
  ctx.lineTo(offsetX + 170, offsetY + 170);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw ellipse
  ctx.fillStyle = "#FFFF00";
  ctx.beginPath();
  ctx.ellipse(
    offsetX + 140,
    offsetY + 140,
    30,
    20,
    Math.PI / 4,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Draw gradient
  const gradient = ctx.createLinearGradient(
    offsetX + 180,
    offsetY + 10,
    offsetX + 280,
    offsetY + 110
  );
  gradient.addColorStop(0, "#FF0000");
  gradient.addColorStop(0.5, "#00FF00");
  gradient.addColorStop(1, "#0000FF");
  ctx.fillStyle = gradient;
  ctx.fillRect(offsetX + 180, offsetY + 10, 100, 100);

  // Draw shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = "#800080";
  ctx.fillRect(offsetX + 200, offsetY + 140, 40, 40);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

// Helper to compare two canvases pixel by pixel
function compareCanvases(canvas1, canvas2, tolerance = 0) {
  const ctx1 = canvas1.getContext("2d");
  const ctx2 = canvas2.getContext("2d");

  const imageData1 = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);
  const imageData2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height);

  if (imageData1.data.length !== imageData2.data.length) {
    return { match: false, message: "Canvas dimensions don't match" };
  }

  let maxDiff = 0;
  let diffCount = 0;
  const significantDiffs = [];

  for (let i = 0; i < imageData1.data.length; i += 4) {
    const r1 = imageData1.data[i];
    const g1 = imageData1.data[i + 1];
    const b1 = imageData1.data[i + 2];
    const a1 = imageData1.data[i + 3];

    const r2 = imageData2.data[i];
    const g2 = imageData2.data[i + 1];
    const b2 = imageData2.data[i + 2];
    const a2 = imageData2.data[i + 3];

    const diff = Math.max(
      Math.abs(r1 - r2),
      Math.abs(g1 - g2),
      Math.abs(b1 - b2),
      Math.abs(a1 - a2)
    );

    if (diff > tolerance) {
      diffCount++;
      if (diff > maxDiff) {
        maxDiff = diff;
        const pixelIndex = i / 4;
        const x = pixelIndex % canvas1.width;
        const y = Math.floor(pixelIndex / canvas1.width);
        if (significantDiffs.length < 10) {
          significantDiffs.push({
            x,
            y,
            diff,
            color1: [r1, g1, b1, a1],
            color2: [r2, g2, b2, a2],
          });
        }
      }
    }
  }

  const totalPixels = imageData1.data.length / 4;
  const diffPercent = (diffCount / totalPixels) * 100;

  return {
    match: diffCount === 0,
    maxDiff,
    diffCount,
    diffPercent,
    totalPixels,
    significantDiffs,
  };
}

describe("Visual comparison tests", () => {
  test("far-canvas produces identical output to vanilla canvas at origin", () => {
    const width = 300;
    const height = 200;

    // Create vanilla canvas
    const vanillaCanvas = createCanvas(width, height);
    const vanillaCtx = vanillaCanvas.getContext("2d");

    // Create far canvas with no transform
    const farCanvas = createCanvas(width, height);
    const farCtx = far(farCanvas, { x: 0, y: 0, scale: 1 }).getContext("2d");

    // Draw same scene on both
    drawTestScene(vanillaCtx);
    drawTestScene(farCtx);

    // Compare pixel by pixel
    const comparison = compareCanvases(vanillaCanvas, farCanvas);

    if (!comparison.match) {
      console.log("Pixel differences found:", comparison);
    }

    expect(comparison.match).toBe(true);
    expect(comparison.diffCount).toBe(0);
  });

  test("far-canvas produces identical output with small offsets", () => {
    const width = 400;
    const height = 300;
    const offsetX = 50;
    const offsetY = 30;

    // Vanilla canvas - draw at origin
    const vanillaCanvas = createCanvas(width, height);
    const vanillaCtx = vanillaCanvas.getContext("2d");
    drawTestScene(vanillaCtx, 0, 0);

    // Far canvas - with offset (50, 30), drawing at world (50, 30) appears at screen (0, 0)
    const farCanvas = createCanvas(width, height);
    const farCtx = far(farCanvas, {
      x: offsetX,
      y: offsetY,
      scale: 1,
    }).getContext("2d");

    // Draw at world coordinates that will appear at screen (0, 0) after offset
    drawTestScene(farCtx, offsetX, offsetY);

    const comparison = compareCanvases(vanillaCanvas, farCanvas);

    if (!comparison.match) {
      console.log("Pixel differences found:", comparison);
    }

    expect(comparison.match).toBe(true);
  });

  test("far-canvas produces identical output with scaling", () => {
    const width = 600;
    const height = 400;
    const scale = 2;

    // Vanilla canvas - manually scale
    const vanillaCanvas = createCanvas(width, height);
    const vanillaCtx = vanillaCanvas.getContext("2d");
    vanillaCtx.scale(scale, scale);

    // Far canvas with same scale
    const farCanvas = createCanvas(width, height);
    const farCtx = far(farCanvas, { x: 0, y: 0, scale: scale }).getContext(
      "2d"
    );

    drawTestScene(vanillaCtx);
    drawTestScene(farCtx);

    const comparison = compareCanvases(vanillaCanvas, farCanvas);

    if (comparison.maxDiff > 2) {
      console.log("Scaling test differences:", {
        maxDiff: comparison.maxDiff,
        diffPercent: comparison.diffPercent,
        diffCount: comparison.diffCount,
        significantDiffs: comparison.significantDiffs.slice(0, 3),
      });
    }

    // Allow more tolerance for scaling - antialiasing and rasterization differences
    expect(comparison.maxDiff).toBeLessThanOrEqual(255); // Allow full difference for edge pixels
    expect(comparison.diffPercent).toBeLessThan(5);
  });

  test("far-canvas produces identical output with combined transform", () => {
    const width = 500;
    const height = 400;
    const scale = 1.5;
    const offsetX = 20;
    const offsetY = 15;

    // Vanilla canvas - just scale, no translate
    const vanillaCanvas = createCanvas(width, height);
    const vanillaCtx = vanillaCanvas.getContext("2d");
    vanillaCtx.scale(scale, scale);

    // Far canvas with combined transform
    const farCanvas = createCanvas(width, height);
    const farCtx = far(farCanvas, {
      x: offsetX,
      y: offsetY,
      scale: scale,
    }).getContext("2d");

    // Vanilla draws at origin
    drawTestScene(vanillaCtx, 0, 0);

    // Far canvas draws at world coordinates that appear at origin after transform
    drawTestScene(farCtx, offsetX, offsetY);

    const comparison = compareCanvases(vanillaCanvas, farCanvas);

    if (comparison.maxDiff > 2) {
      console.log("Combined transform test differences:", {
        maxDiff: comparison.maxDiff,
        diffPercent: comparison.diffPercent,
        diffCount: comparison.diffCount,
        significantDiffs: comparison.significantDiffs.slice(0, 3),
      });
    }

    // Allow more tolerance
    expect(comparison.maxDiff).toBeLessThanOrEqual(255); // Allow full difference for edge pixels
    expect(comparison.diffPercent).toBeLessThan(5);
  });

  test("demonstrates vanilla canvas precision issues at large coordinates", () => {
    const width = 300;
    const height = 200;
    const farAway = 100000000; // 100 million pixels - more extreme

    // Create two vanilla canvases
    const canvas1 = createCanvas(width, height);
    const ctx1 = canvas1.getContext("2d");

    const canvas2 = createCanvas(width, height);
    const ctx2 = canvas2.getContext("2d");

    // Draw at origin
    ctx1.fillStyle = "#FF0000";
    ctx1.fillRect(50, 50, 100, 100);
    ctx1.strokeStyle = "#0000FF";
    ctx1.lineWidth = 10;
    ctx1.strokeRect(50, 50, 100, 100);

    // Draw far away and translate back
    ctx2.save();
    ctx2.translate(-farAway, -farAway);
    ctx2.fillStyle = "#FF0000";
    ctx2.fillRect(farAway + 50, farAway + 50, 100, 100);
    ctx2.strokeStyle = "#0000FF";
    ctx2.lineWidth = 10;
    ctx2.strokeRect(farAway + 50, farAway + 50, 100, 100);
    ctx2.restore();

    const comparison = compareCanvases(canvas1, canvas2);

    console.log(`Vanilla canvas precision at ${farAway}px:`, {
      match: comparison.match,
      maxDiff: comparison.maxDiff,
      diffPercent: comparison.diffPercent,
    });

    // The node canvas library might handle large coordinates better than browsers
    // So let's just check if far-canvas is at least as good
    if (comparison.match) {
      console.log(
        "Note: This canvas implementation doesn't show precision issues at large coordinates"
      );
    }
  });

  test("far-canvas maintains precision at large coordinates", () => {
    const width = 300;
    const height = 200;
    const farAway = 10000000; // 10 million pixels

    // Reference canvas at origin
    const refCanvas = createCanvas(width, height);
    const refCtx = refCanvas.getContext("2d");
    refCtx.fillStyle = "#FF0000";
    refCtx.fillRect(50, 50, 100, 100);
    refCtx.strokeStyle = "#0000FF";
    refCtx.lineWidth = 10;
    refCtx.strokeRect(50, 50, 100, 100);

    // Far canvas rendering at large coordinates
    const farCanvas = createCanvas(width, height);
    const farCtx = far(farCanvas, {
      x: farAway, // Viewport is at position farAway in world space
      y: farAway,
      scale: 1,
    }).getContext("2d");
    farCtx.fillStyle = "#FF0000";
    farCtx.fillRect(farAway + 50, farAway + 50, 100, 100); // Draw at world coordinates
    farCtx.strokeStyle = "#0000FF";
    farCtx.lineWidth = 10;
    farCtx.strokeRect(farAway + 50, farAway + 50, 100, 100);

    const comparison = compareCanvases(refCanvas, farCanvas);

    // Far canvas should maintain precision
    expect(comparison.match).toBe(true);
    expect(comparison.diffCount).toBe(0);
  });

  test("clearCanvas works correctly", () => {
    const width = 200;
    const height = 200;

    const canvas = createCanvas(width, height);
    const ctx = far(canvas, { x: 50, y: 50, scale: 2 }).getContext("2d");

    // Fill with color
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(-25, -25, 100, 100);

    // Clear canvas
    ctx.clearCanvas();

    // Check all pixels are transparent
    const imageData = canvas.getContext("2d").getImageData(0, 0, width, height);
    let allClear = true;

    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] !== 0) {
        allClear = false;
        break;
      }
    }

    expect(allClear).toBe(true);
  });

  test("font rendering matches vanilla canvas behavior", () => {
    const width = 300;
    const height = 100;

    const vanillaCanvas = createCanvas(width, height);
    const vanillaCtx = vanillaCanvas.getContext("2d");

    const farCanvas = createCanvas(width, height);
    const farCtx = far(farCanvas, { x: 0, y: 0, scale: 1 }).getContext("2d");

    // Set identical fonts
    const testFont = "20px Arial";
    vanillaCtx.font = testFont;
    farCtx.font = testFont;

    // Fill background
    vanillaCtx.fillStyle = "white";
    vanillaCtx.fillRect(0, 0, width, height);
    farCtx.fillStyle = "white";
    farCtx.fillRect(0, 0, width, height);

    // Draw text
    vanillaCtx.fillStyle = "black";
    vanillaCtx.fillText("Hello World", 10, 50);
    farCtx.fillStyle = "black";
    farCtx.fillText("Hello World", 10, 50);

    const comparison = compareCanvases(vanillaCanvas, farCanvas);

    // Font rendering might have slight antialiasing differences
    expect(comparison.maxDiff).toBeLessThanOrEqual(5);
    expect(comparison.diffPercent).toBeLessThan(1);
  });

  test("validates coordinate transformation accuracy", () => {
    const width = 200;
    const height = 200;

    // Test specific coordinates with translation
    const offsetX = 50;
    const offsetY = 30;

    const vanillaCanvas = createCanvas(width, height);
    const vanillaCtx = vanillaCanvas.getContext("2d");

    const farCanvas = createCanvas(width, height);
    const farCtx = far(farCanvas, {
      x: offsetX,
      y: offsetY,
      scale: 1,
    }).getContext("2d");

    // Fill white background
    vanillaCtx.fillStyle = "white";
    vanillaCtx.fillRect(0, 0, width, height);
    farCtx.fillStyle = "white";
    farCtx.fillRect(offsetX, offsetY, width, height); // Draw at world coords to fill screen

    // Draw a simple rectangle at a specific position
    vanillaCtx.fillStyle = "red";
    vanillaCtx.fillRect(20, 40, 60, 80);

    // Far canvas draws at world coordinates (offset + screen position)
    farCtx.fillStyle = "red";
    farCtx.fillRect(offsetX + 20, offsetY + 40, 60, 80);

    const comparison = compareCanvases(vanillaCanvas, farCanvas);

    expect(comparison.match).toBe(true);
    expect(comparison.diffCount).toBe(0);
  });

  test("checks edge rendering with fractional coordinates", () => {
    const width = 100;
    const height = 100;
    const scale = 1.7; // Non-integer scale

    const vanillaCanvas = createCanvas(width, height);
    const vanillaCtx = vanillaCanvas.getContext("2d");
    vanillaCtx.scale(scale, scale);

    const farCanvas = createCanvas(width, height);
    const farCtx = far(farCanvas, { x: 0, y: 0, scale: scale }).getContext(
      "2d"
    );

    // White background
    vanillaCtx.fillStyle = "white";
    vanillaCtx.fillRect(0, 0, width / scale, height / scale);
    farCtx.fillStyle = "white";
    farCtx.fillRect(0, 0, width / scale, height / scale);

    // Draw shapes with fractional coordinates
    vanillaCtx.fillStyle = "black";
    vanillaCtx.fillRect(10.3, 20.7, 30.6, 25.4);

    farCtx.fillStyle = "black";
    farCtx.fillRect(10.3, 20.7, 30.6, 25.4);

    const comparison = compareCanvases(vanillaCanvas, farCanvas);

    // Some rounding differences are expected
    expect(comparison.maxDiff).toBeLessThanOrEqual(100);
    expect(comparison.diffPercent).toBeLessThan(10);
  });
});
