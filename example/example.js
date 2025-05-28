function getReferenceContext2d(element, transform) {
  const context = element.getContext("2d");
  context.scale(transform.scale, transform.scale);
  context.translate(transform.x, transform.y);

  return context;
}

function getFarContext2d(element, transform) {
  return far.far(element, transform).getContext("2d");
}

const referenceCanvas = document.getElementById("reference");
const farNearCanvas = document.getElementById("far_near");
const farFarCanvas = document.getElementById("far_far");

const image = { data: document.createElement("img"), width: 320, height: 164 };
const canvasDimensions = { width: 700, height: 1200 };

[referenceCanvas, farNearCanvas, farFarCanvas].forEach((canvas) => {
  canvas.width = canvasDimensions.width;
  canvas.height = canvasDimensions.height;
});

const scale = canvasDimensions.width / image.width;
const FOCUS_NEAR = 5000;
const FOCUS_FAR = 500000000;
const diff = 0;

function defineSceneElements(currentFocus) {
  return {
    images: [
      {
        x: 0,
        y: currentFocus - 1 * image.height,
        data: image.data,
        width: image.width,
        height: image.height,
      },
      {
        x: 0,
        y: currentFocus + 0 * image.height,
        data: image.data,
        width: image.width,
        height: image.height,
      },
      {
        x: 0,
        y: currentFocus + 1 * image.height,
        data: image.data,
        width: image.width,
        height: image.height,
      },
    ],
    rectangles: [
      { x: 10, y: currentFocus + 20, width: 200, height: 30 },
      { x: 100, y: currentFocus + 250, width: 200, height: 30 },
      { x: -10, y: currentFocus - 10, width: 200, height: 30 },
      { x: 100, y: currentFocus + 400, width: 200, height: 30 },
      {
        x: 0,
        y: currentFocus + 2 * image.height,
        width: image.width,
        height: image.height,
      },
    ],
  };
}

const contextReference = getReferenceContext2d(referenceCanvas, {
  x: 0,
  y: -FOCUS_NEAR - diff,
  scale: scale,
});

const contextFarNear = getFarContext2d(farNearCanvas, {
  x: 0,
  y: FOCUS_NEAR - diff,
  scale: scale,
});

const contextFarFar = getFarContext2d(farFarCanvas, {
  x: 0,
  y: FOCUS_FAR - diff,
  scale: scale,
});

image.data.onload = function () {
  function render(ctx, currentFocusValue, isReference = false) {
    if (isReference) {
      ctx.fillStyle = "white";
      ctx.fillRect(
        0,
        0,
        canvasDimensions.width / scale,
        canvasDimensions.height / scale
      );
    } else {
      ctx.clearCanvas();
    }

    const { images, rectangles } = defineSceneElements(currentFocusValue);

    images.forEach((imgDef, i) => {
      ctx.save();
      ctx.drawImage(
        imgDef.data,
        imgDef.x,
        imgDef.y,
        imgDef.width,
        imgDef.height
      );
      ctx.beginPath();
      ctx.strokeStyle = "#803";
      ctx.lineWidth = 1;
      ctx.rect(imgDef.x, imgDef.y, imgDef.width, imgDef.height);
      ctx.stroke();
      ctx.restore();
    });

    rectangles.forEach((rectangle) => {
      ctx.save();
      ctx.fillStyle = "#CE0";
      ctx.fillRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);

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

      ctx.fillStyle = "#F08";
      ctx.fillText("example", rectangle.x, rectangle.y + 10);

      ctx.font = "bold 48px serif";
      ctx.strokeStyle = "#0F8";
      ctx.strokeText("far", rectangle.x, rectangle.y + 48);
      ctx.restore();
    });
  }

  render(contextReference, FOCUS_NEAR, true);
  render(contextFarNear, FOCUS_NEAR, false);
  render(contextFarFar, FOCUS_FAR, false);
};

image.data.src =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Saturn_from_Cassini_Orbiter_%282004-10-06%29.jpg/320px-Saturn_from_Cassini_Orbiter_%282004-10-06%29.jpg";
