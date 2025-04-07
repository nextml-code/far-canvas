import { far } from "../src/index.js";

function getReferenceContext2d(element, transform) {
  const context = element.getContext("2d");
  // Reset transform first
  context.resetTransform();
  // Then apply in same order: scale, rotate, translate
  context.scale(transform.scale, transform.scale);
  if (transform.rotation) {
    context.rotate(transform.rotation);
  }
  context.translate(transform.x, transform.y);

  return context;
}

function getFarContext2d(element, transform) {
  return far(element, transform).getContext("2d");
}

const referenceCanvas = document.getElementById("reference");
const farCanvas = document.getElementById("far");

const image = { data: document.createElement("img"), width: 320, height: 164 };
const canvasDimensions = { width: 700, height: 1200 };

referenceCanvas.width = canvasDimensions.width;
referenceCanvas.height = canvasDimensions.height;
farCanvas.width = canvasDimensions.width;
farCanvas.height = canvasDimensions.height;

const scale = canvasDimensions.width / image.width;
const focus = 10000; // 500000000 // breaks down in vanilla canvas

const diff = -image.height * 0;

const mkImage = ({ x, y, image }) => ({
  x,
  y,
  data: image.data,
  width: image.width,
  height: image.height,
});

const images = [
  mkImage({ x: 0, y: focus - 1 * image.height, image }),
  mkImage({ x: 0, y: focus + 0 * image.height, image }),
  mkImage({ x: 0, y: focus + 1 * image.height, image }),
  mkImage({ x: 0, y: focus + 2 * image.height, image }),
  mkImage({ x: 0, y: focus + 3 * image.height, image }),
  mkImage({ x: 0, y: focus + 4 * image.height, image }),
];

const rectangles = [
  { x: 10, y: focus + 20, width: 200, height: 30 },
  { x: 100, y: focus + 250, width: 200, height: 30 },
  { x: -10, y: focus - 10, width: 200, height: 30 },
  { x: 100, y: focus + 400, width: 200, height: 30 },
  {
    x: 0,
    y: focus + 2 * image.height,
    width: image.width,
    height: image.height,
  },
];

const contextReference = getReferenceContext2d(
  document.getElementById("reference"),
  { x: 0, y: -focus - diff, scale: scale }
);
const contextFar = getFarContext2d(document.getElementById("far"), {
  x: 0,
  y: -focus - diff,
  scale: scale,
});

image.data.onload = function () {
  function render(ctx) {
    // Clear the canvas first
    ctx.save();
    ctx.resetTransform();
    ctx.clearRect(0, 0, canvasDimensions.width, canvasDimensions.height);
    ctx.restore();

    images.forEach((image, i) => {
      ctx.save();

      if (i == 1) {
        ctx.drawImage(image.data, image.x, image.y);
      } else {
        ctx.drawImage(
          image.data,
          image.x,
          image.y,
          image.width - i * 32,
          image.height
        );
      }
      ctx.beginPath();
      ctx.strokeStyle = "#803";
      ctx.lineWidth = 1;
      ctx.rect(image.x, image.y, image.width, image.height);
      ctx.stroke();

      ctx.restore();
    });
    rectangles.forEach((rectangle) => {
      ctx.save();

      ctx.save();
      ctx.fillStyle = "#CE0";
      ctx.fillRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = "#803";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(rectangle.x, rectangle.y);
      ctx.lineTo(rectangle.x + rectangle.width, rectangle.y + rectangle.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rectangle.x + rectangle.width, rectangle.y);
      ctx.lineTo(rectangle.x, rectangle.y + rectangle.height);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.fillStyle = "#F08";
      ctx.fillText("example", rectangle.x, rectangle.y + 10);
      ctx.font = "bold 48px serif";
      ctx.strokeStyle = "#0F8";
      ctx.strokeText("far", rectangle.x, rectangle.y + 48);
      ctx.restore();

      ctx.restore();
    });
    // Draw transform tests last (at the top of canvas)
    testTransforms(ctx);
  }

  // Run rendering
  render(contextReference);
  render(contextFar);
};
image.data.src =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Saturn_from_Cassini_Orbiter_%282004-10-06%29.jpg/320px-Saturn_from_Cassini_Orbiter_%282004-10-06%29.jpg";

// Test transform operations
function testTransforms(ctx) {
  // Save current state before switching to screen space
  ctx.save();
  ctx.resetTransform();

  // Clear the test area
  ctx.fillStyle = "#EEE";
  ctx.fillRect(0, 0, 400, 200);

  // Draw a grid for reference
  ctx.strokeStyle = "#CCC";
  for (let x = 0; x <= 400; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 200);
    ctx.stroke();
  }
  for (let y = 0; y <= 200; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(400, y);
    ctx.stroke();
  }

  // Draw labels
  ctx.fillStyle = "#000";
  ctx.font = "12px sans-serif";
  ctx.fillText("1. Blue: translate(50,50)", 10, 15);
  ctx.fillText("2. Green: scale(2,2)", 10, 30);
  ctx.fillText("3. Red: rotate(45°)", 10, 45);
  ctx.fillText("4. Yellow: setTransform(skew)", 10, 60);

  // Test 1: Basic translation
  ctx.save();
  ctx.translate(50, 50);
  ctx.fillStyle = "#00F";
  ctx.fillRect(0, 0, 30, 30);
  ctx.restore();

  // Test 2: Scale
  ctx.save();
  ctx.translate(100, 50);
  ctx.scale(2, 2);
  ctx.fillStyle = "#0F0";
  ctx.fillRect(-15, -15, 15, 15);
  ctx.restore();

  // Test 3: Rotation
  ctx.save();
  ctx.translate(150, 50);
  ctx.rotate(Math.PI / 4); // 45 degrees
  ctx.fillStyle = "#F00";
  ctx.fillRect(-10, -10, 20, 20);
  ctx.restore();

  // Test 4: setTransform (absolute)
  ctx.save();
  ctx.setTransform(1, 0.2, 0.2, 1, 250, 75);
  ctx.fillStyle = "#FF0";
  ctx.fillRect(0, 0, 30, 30);
  ctx.restore();

  // Restore original state (back to world space)
  ctx.restore();
}
