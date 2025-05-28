const { far } = require("../lib.cjs/index.js");
const { createCanvas, loadImage } = require("canvas");
const path = require("path"); // For loading local image if needed, or use a mock

describe("Example.js Scene Consistency Test (Far Focus vs. Near Focus)", () => {
  const SCALE = 2.1875; // From example
  const FOCUS_NEAR = 5000;
  const FOCUS_FAR = 500000000;

  // Dimensions from example.js
  const CANVAS_WIDTH = 700;
  const CANVAS_HEIGHT = 1200;
  const IMAGE_WIDTH = 320;
  const IMAGE_HEIGHT = 164;

  // Mock image data for testing without network dependency
  // Create a simple 1x1 red pixel image for mock
  const mockImageCanvas = createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);
  const mockImageCtx = mockImageCanvas.getContext("2d");
  mockImageCtx.fillStyle = "rgba(255,0,0,0.1)"; // Semi-transparent red to make it distinct
  mockImageCtx.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
  mockImageCtx.fillStyle = "black";
  mockImageCtx.font = "20px Arial";
  mockImageCtx.fillText("Mock Image", 10, 50);
  const MOCK_IMAGE_OBJECT = mockImageCanvas; // Use canvas as image source for node-canvas

  function defineSceneElements(currentFocusValue) {
    const images = [
      {
        x: 0,
        y: currentFocusValue - 1 * IMAGE_HEIGHT,
        data: MOCK_IMAGE_OBJECT,
        width: IMAGE_WIDTH,
        height: IMAGE_HEIGHT,
      },
      {
        x: 0,
        y: currentFocusValue + 0 * IMAGE_HEIGHT,
        data: MOCK_IMAGE_OBJECT,
        width: IMAGE_WIDTH,
        height: IMAGE_HEIGHT,
      },
      {
        x: 0,
        y: currentFocusValue + 1 * IMAGE_HEIGHT,
        data: MOCK_IMAGE_OBJECT,
        width: IMAGE_WIDTH,
        height: IMAGE_HEIGHT,
      },
    ];
    const rectangles = [
      { x: 10, y: currentFocusValue + 20, width: 200, height: 30 },
      { x: 100, y: currentFocusValue + 250, width: 200, height: 30 },
      {
        x: 0,
        y: currentFocusValue + 2 * IMAGE_HEIGHT,
        width: IMAGE_WIDTH,
        height: IMAGE_HEIGHT,
      },
    ];
    return { images, rectangles };
  }

  function renderExampleScene(ctx, currentFocusValue) {
    ctx.clearCanvas();
    // Optional: Fill with a distinct background if clearCanvas makes it transparent and hard to debug
    // const inv = ctx.s.inv;
    // ctx.fillStyle = 'lightgray'; // Use a light gray for debugging if needed
    // ctx.fillRect(inv.x(0), inv.y(0), CANVAS_WIDTH / SCALE, CANVAS_HEIGHT / SCALE);

    const { images, rectangles } = defineSceneElements(currentFocusValue);

    images.forEach((image, i) => {
      ctx.save();
      // In example.js, all images were drawn at full width after recent fix
      ctx.drawImage(image.data, image.x, image.y, image.width, image.height);
      ctx.beginPath();
      ctx.strokeStyle = "#803"; // Border color
      ctx.lineWidth = 1; // World units
      ctx.rect(image.x, image.y, image.width, image.height);
      ctx.stroke();
      ctx.restore();
    });

    rectangles.forEach((rectangle) => {
      ctx.save();
      ctx.fillStyle = "#CE0"; // Yellowish
      ctx.fillRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);

      ctx.strokeStyle = "#803"; // Maroon for cross
      ctx.lineWidth = 8; // World units
      ctx.beginPath();
      ctx.moveTo(rectangle.x, rectangle.y);
      ctx.lineTo(rectangle.x + rectangle.width, rectangle.y + rectangle.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rectangle.x + rectangle.width, rectangle.y);
      ctx.lineTo(rectangle.x, rectangle.y + rectangle.height);
      ctx.stroke();

      // Text rendering - critical part
      ctx.fillStyle = "#F08"; // Pinkish for "example"
      // Default font (10px sans-serif world) will be used here as in example.js
      ctx.fillText("example", rectangle.x, rectangle.y + 10);

      ctx.font = "bold 48px serif"; // World units
      ctx.strokeStyle = "#0F8"; // Green for "far"
      // fillText for "far" was in example, let's use strokeText for consistency with example's visual for "far"
      ctx.strokeText("far", rectangle.x, rectangle.y + 48);
      ctx.restore();
    });
  }

  test("full example scene should be identical on far-canvas between near and far focus points", async () => {
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

    // 3. Draw the scene on both
    // No need to await if MOCK_IMAGE_OBJECT is a canvas. If it were a real loadImage, we'd need async/await.
    renderExampleScene(farCtxNear, FOCUS_NEAR);
    renderExampleScene(farCtxFar, FOCUS_FAR);

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

    // Force saving images for visual inspection
    console.log(
      `Pixel data comparison result (firstDifferenceIndex): ${firstDifferenceIndex}.`
    );
    if (firstDifferenceIndex !== -1) {
      console.log(
        `Near Value: ${farNearData[firstDifferenceIndex]}, Far Value: ${farFarData[firstDifferenceIndex]}`
      );
    }
    const fs = require("fs");
    fs.writeFileSync(
      "example_scene_near.png",
      farCanvasNearInstance.toBuffer("image/png")
    );
    fs.writeFileSync(
      "example_scene_far.png",
      farCanvasFarInstance.toBuffer("image/png")
    );
    console.log("Forced save of example scene consistency test images.");
    // End of forced save

    expect(firstDifferenceIndex).toBe(-1); // Asserts that all pixel data is identical
  });
});
