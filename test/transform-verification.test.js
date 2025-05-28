const { far } = require("../lib.cjs/index.js");
const { createCanvas } = require("canvas");

describe("Transform verification", () => {
  test("verifies far-canvas offset behavior matches fallback", () => {
    const width = 200;
    const height = 200;
    const offsetX = 50;
    const offsetY = 30;

    // Create a canvas with far-canvas
    const canvas = createCanvas(width, height);
    const ctx = far(canvas, { x: offsetX, y: offsetY, scale: 1 }).getContext(
      "2d"
    );

    // Draw at world coordinates (60, 40)
    ctx.fillStyle = "red";
    ctx.fillRect(60, 40, 20, 20);

    // This should appear at screen coordinates:
    // x: (60 - 50) * 1 = 10
    // y: (40 - 30) * 1 = 10

    // Check the pixel at (10, 10) is red
    const imageData = canvas.getContext("2d").getImageData(10, 10, 1, 1);
    const [r, g, b] = imageData.data;

    expect(r).toBe(255);
    expect(g).toBe(0);
    expect(b).toBe(0);
  });

  test("verifies far-canvas scale behavior matches fallback", () => {
    const width = 200;
    const height = 200;
    const scale = 2;

    // Create a canvas with far-canvas
    const canvas = createCanvas(width, height);
    const ctx = far(canvas, { x: 0, y: 0, scale: scale }).getContext("2d");

    // Draw at world coordinates (10, 10) with size 20x20
    ctx.fillStyle = "blue";
    ctx.fillRect(10, 10, 20, 20);

    // This should appear at screen coordinates:
    // x: (10 - 0) * 2 = 20
    // y: (10 - 0) * 2 = 20
    // width: 20 * 2 = 40
    // height: 20 * 2 = 40

    // Check corners of the rectangle
    const topLeft = canvas.getContext("2d").getImageData(20, 20, 1, 1);
    const bottomRight = canvas.getContext("2d").getImageData(59, 59, 1, 1);
    const outside = canvas.getContext("2d").getImageData(19, 19, 1, 1);

    // Inside should be blue
    expect(topLeft.data[2]).toBe(255); // Blue channel
    expect(bottomRight.data[2]).toBe(255);

    // Outside should not be blue
    expect(outside.data[2]).toBe(0);
  });

  test("verifies far-canvas combined transform behavior", () => {
    const width = 200;
    const height = 200;
    const offsetX = 10;
    const offsetY = 20;
    const scale = 2;

    // Create a canvas with far-canvas
    const canvas = createCanvas(width, height);
    const ctx = far(canvas, {
      x: offsetX,
      y: offsetY,
      scale: scale,
    }).getContext("2d");

    // Draw at world coordinates (15, 30)
    ctx.fillStyle = "#00FF00";
    ctx.fillRect(15, 30, 10, 10);

    // This should appear at screen coordinates:
    // x: (15 - 10) * 2 = 10
    // y: (30 - 20) * 2 = 20
    // width: 10 * 2 = 20
    // height: 10 * 2 = 20

    // Check center of the rectangle
    const center = canvas.getContext("2d").getImageData(19, 29, 1, 1);
    expect(center.data[1]).toBe(255); // Green channel
  });
});
