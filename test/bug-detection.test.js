const { far } = require("../lib.cjs/index.js");
const { createCanvas } = require("canvas");

describe("Bug detection tests", () => {
  test("verifies drawImage with 4 args transforms correctly", () => {
    const width = 200;
    const height = 200;
    const scale = 2;
    const offsetX = 10;
    const offsetY = 20;

    // Create a source image
    const sourceCanvas = createCanvas(100, 100);
    const sourceCtx = sourceCanvas.getContext("2d");
    sourceCtx.fillStyle = "red";
    sourceCtx.fillRect(0, 0, 100, 100);

    // Vanilla canvas
    const vanillaCanvas = createCanvas(width, height);
    const vanillaCtx = vanillaCanvas.getContext("2d");
    vanillaCtx.scale(scale, scale);
    vanillaCtx.translate(offsetX, offsetY);
    vanillaCtx.fillStyle = "white";
    vanillaCtx.fillRect(0, 0, width / scale, height / scale);
    vanillaCtx.drawImage(sourceCanvas, 10, 15, 40, 30);

    // Far canvas
    const farCanvas = createCanvas(width, height);
    const farCtx = far(farCanvas, {
      x: offsetX,
      y: offsetY,
      scale: scale,
    }).getContext("2d");
    farCtx.fillStyle = "white";
    farCtx.fillRect(0, 0, width / scale, height / scale);
    farCtx.drawImage(sourceCanvas, 10, 15, 40, 30);

    // Compare
    const imageData1 = vanillaCanvas
      .getContext("2d")
      .getImageData(0, 0, width, height);
    const imageData2 = farCanvas
      .getContext("2d")
      .getImageData(0, 0, width, height);

    let maxDiff = 0;
    for (let i = 0; i < imageData1.data.length; i++) {
      const diff = Math.abs(imageData1.data[i] - imageData2.data[i]);
      maxDiff = Math.max(maxDiff, diff);
    }

    expect(maxDiff).toBeLessThanOrEqual(5);
  });

  test("verifies arc method counterclockwise parameter", () => {
    const width = 200;
    const height = 200;

    // Test with counterclockwise = true
    const canvas1 = createCanvas(width, height);
    const ctx1 = far(canvas1, { x: 0, y: 0, scale: 1 }).getContext("2d");
    ctx1.fillStyle = "white";
    ctx1.fillRect(0, 0, width, height);
    ctx1.fillStyle = "black";
    ctx1.beginPath();
    ctx1.arc(100, 100, 50, 0, Math.PI, true);
    ctx1.fill();

    // Test with counterclockwise = false
    const canvas2 = createCanvas(width, height);
    const ctx2 = far(canvas2, { x: 0, y: 0, scale: 1 }).getContext("2d");
    ctx2.fillStyle = "white";
    ctx2.fillRect(0, 0, width, height);
    ctx2.fillStyle = "black";
    ctx2.beginPath();
    ctx2.arc(100, 100, 50, 0, Math.PI, false);
    ctx2.fill();

    // The two should be different
    const imageData1 = canvas1
      .getContext("2d")
      .getImageData(0, 0, width, height);
    const imageData2 = canvas2
      .getContext("2d")
      .getImageData(0, 0, width, height);

    let diffCount = 0;
    for (let i = 0; i < imageData1.data.length; i++) {
      if (imageData1.data[i] !== imageData2.data[i]) {
        diffCount++;
      }
    }

    expect(diffCount).toBeGreaterThan(0);
  });

  test("verifies gradient transformations are correct", () => {
    const width = 200;
    const height = 200;
    const scale = 2;

    const vanillaCanvas = createCanvas(width, height);
    const vanillaCtx = vanillaCanvas.getContext("2d");
    vanillaCtx.scale(scale, scale);

    const farCanvas = createCanvas(width, height);
    const farCtx = far(farCanvas, { x: 0, y: 0, scale: scale }).getContext(
      "2d"
    );

    // Create identical gradients
    const vanillaGradient = vanillaCtx.createLinearGradient(10, 10, 60, 60);
    vanillaGradient.addColorStop(0, "red");
    vanillaGradient.addColorStop(1, "blue");

    const farGradient = farCtx.createLinearGradient(10, 10, 60, 60);
    farGradient.addColorStop(0, "red");
    farGradient.addColorStop(1, "blue");

    // Fill with gradients
    vanillaCtx.fillStyle = vanillaGradient;
    vanillaCtx.fillRect(0, 0, 100, 100);

    farCtx.fillStyle = farGradient;
    farCtx.fillRect(0, 0, 100, 100);

    // Compare center pixel - should be similar
    const vanillaData = vanillaCanvas
      .getContext("2d")
      .getImageData(100, 100, 1, 1).data;
    const farData = farCanvas
      .getContext("2d")
      .getImageData(100, 100, 1, 1).data;

    const rDiff = Math.abs(vanillaData[0] - farData[0]);
    const gDiff = Math.abs(vanillaData[1] - farData[1]);
    const bDiff = Math.abs(vanillaData[2] - farData[2]);

    expect(rDiff).toBeLessThanOrEqual(10);
    expect(gDiff).toBeLessThanOrEqual(10);
    expect(bDiff).toBeLessThanOrEqual(10);
  });

  test("verifies clip operation works correctly", () => {
    const width = 200;
    const height = 200;

    const canvas = createCanvas(width, height);
    const ctx = far(canvas, { x: 50, y: 50, scale: 1 }).getContext("2d");

    // Fill white background
    ctx.fillStyle = "white";
    ctx.fillRect(-50, -50, width, height);

    // Create clipping region
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.clip();

    // Fill large rectangle - should be clipped to circle
    ctx.fillStyle = "black";
    ctx.fillRect(-50, -50, 100, 100);

    // Check that pixels outside the circle are white
    const imageData = canvas.getContext("2d").getImageData(0, 0, width, height);

    // Check corner pixel (should be white)
    const cornerIdx = 0;
    expect(imageData.data[cornerIdx]).toBe(255); // R
    expect(imageData.data[cornerIdx + 1]).toBe(255); // G
    expect(imageData.data[cornerIdx + 2]).toBe(255); // B

    // Check center pixel (should be black)
    const centerX = 50;
    const centerY = 50;
    const centerIdx = (centerY * width + centerX) * 4;
    expect(imageData.data[centerIdx]).toBe(0); // R
    expect(imageData.data[centerIdx + 1]).toBe(0); // G
    expect(imageData.data[centerIdx + 2]).toBe(0); // B
  });

  test("verifies line dash offset transforms correctly", () => {
    const width = 300;
    const height = 100;
    const scale = 2;

    const vanillaCanvas = createCanvas(width, height);
    const vanillaCtx = vanillaCanvas.getContext("2d");
    vanillaCtx.scale(scale, scale);

    const farCanvas = createCanvas(width, height);
    const farCtx = far(farCanvas, { x: 0, y: 0, scale: scale }).getContext(
      "2d"
    );

    // Set line dash pattern
    vanillaCtx.setLineDash([5, 5]);
    vanillaCtx.lineDashOffset = 2;
    farCtx.setLineDash([5, 5]);
    farCtx.lineDashOffset = 2;

    // White background
    vanillaCtx.fillStyle = "white";
    vanillaCtx.fillRect(0, 0, width / scale, height / scale);
    farCtx.fillStyle = "white";
    farCtx.fillRect(0, 0, width / scale, height / scale);

    // Draw dashed lines
    vanillaCtx.strokeStyle = "black";
    vanillaCtx.lineWidth = 2;
    vanillaCtx.beginPath();
    vanillaCtx.moveTo(10, 25);
    vanillaCtx.lineTo(140, 25);
    vanillaCtx.stroke();

    farCtx.strokeStyle = "black";
    farCtx.lineWidth = 2;
    farCtx.beginPath();
    farCtx.moveTo(10, 25);
    farCtx.lineTo(140, 25);
    farCtx.stroke();

    // Compare middle section
    const vanillaData = vanillaCanvas
      .getContext("2d")
      .getImageData(100, 40, 50, 20);
    const farData = farCanvas.getContext("2d").getImageData(100, 40, 50, 20);

    let maxDiff = 0;
    for (let i = 0; i < vanillaData.data.length; i++) {
      const diff = Math.abs(vanillaData.data[i] - farData.data[i]);
      maxDiff = Math.max(maxDiff, diff);
    }

    expect(maxDiff).toBeLessThanOrEqual(10);
  });

  test("verifies shadow properties transform correctly", () => {
    const width = 200;
    const height = 200;
    const scale = 2;

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

    // Set shadow properties
    const shadowProps = {
      shadowColor: "rgba(0, 0, 0, 0.5)",
      shadowBlur: 5,
      shadowOffsetX: 3,
      shadowOffsetY: 3,
    };

    Object.assign(vanillaCtx, shadowProps);
    Object.assign(farCtx, shadowProps);

    // Draw rectangle with shadow
    vanillaCtx.fillStyle = "red";
    vanillaCtx.fillRect(30, 30, 40, 40);

    farCtx.fillStyle = "red";
    farCtx.fillRect(30, 30, 40, 40);

    // Compare a region that should contain the shadow
    const vanillaData = vanillaCanvas
      .getContext("2d")
      .getImageData(130, 130, 20, 20);
    const farData = farCanvas.getContext("2d").getImageData(130, 130, 20, 20);

    let hasNonWhitePixels = false;
    for (let i = 0; i < farData.data.length; i += 4) {
      if (
        farData.data[i] < 255 ||
        farData.data[i + 1] < 255 ||
        farData.data[i + 2] < 255
      ) {
        hasNonWhitePixels = true;
        break;
      }
    }

    expect(hasNonWhitePixels).toBe(true);

    // Shadows should be somewhat similar
    let totalDiff = 0;
    for (let i = 0; i < vanillaData.data.length; i++) {
      totalDiff += Math.abs(vanillaData.data[i] - farData.data[i]);
    }
    const avgDiff = totalDiff / vanillaData.data.length;

    expect(avgDiff).toBeLessThan(30);
  });

  test("verifies drawImage with 8 args (source rect) transforms correctly", () => {
    const width = 200;
    const height = 200;
    const scale = 2;

    // Create a source image with pattern
    const sourceCanvas = createCanvas(100, 100);
    const sourceCtx = sourceCanvas.getContext("2d");
    sourceCtx.fillStyle = "red";
    sourceCtx.fillRect(0, 0, 100, 100);
    sourceCtx.fillStyle = "blue";
    sourceCtx.fillRect(25, 25, 50, 50);

    // Vanilla canvas
    const vanillaCanvas = createCanvas(width, height);
    const vanillaCtx = vanillaCanvas.getContext("2d");
    vanillaCtx.scale(scale, scale);
    vanillaCtx.fillStyle = "white";
    vanillaCtx.fillRect(0, 0, width / scale, height / scale);
    // Draw only the blue center part, scaled up
    vanillaCtx.drawImage(sourceCanvas, 25, 25, 50, 50, 10, 10, 40, 40);

    // Far canvas
    const farCanvas = createCanvas(width, height);
    const farCtx = far(farCanvas, { x: 0, y: 0, scale: scale }).getContext(
      "2d"
    );
    farCtx.fillStyle = "white";
    farCtx.fillRect(0, 0, width / scale, height / scale);
    // Draw only the blue center part, scaled up
    farCtx.drawImage(sourceCanvas, 25, 25, 50, 50, 10, 10, 40, 40);

    // Compare
    const imageData1 = vanillaCanvas
      .getContext("2d")
      .getImageData(0, 0, width, height);
    const imageData2 = farCanvas
      .getContext("2d")
      .getImageData(0, 0, width, height);

    let maxDiff = 0;
    for (let i = 0; i < imageData1.data.length; i++) {
      const diff = Math.abs(imageData1.data[i] - imageData2.data[i]);
      maxDiff = Math.max(maxDiff, diff);
    }

    expect(maxDiff).toBeLessThanOrEqual(5);
  });
});
