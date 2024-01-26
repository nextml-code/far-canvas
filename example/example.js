const canvasDimensions = { width: 700 * 2, height: 1200 * 2 };

function getReferenceContext2d(element, transform) {
  const context = element.getContext("2d");
  context.scale(transform.scale, transform.scale);
  context.translate(transform.x, transform.y);

  context.translate(transform.rotation.x, transform.rotation.y);
  context.rotate(transform.rotation.angle);
  context.translate(-transform.rotation.x, -transform.rotation.y);

  return context;
}

function getFarContext2d(element, transform) {
  const context = far.far(element, transform).getContext("2d");

  return context;
}

const referenceCanvas = document.getElementById("reference");
const farCanvas = document.getElementById("far");

const image = { data: document.createElement("img"), width: 320, height: 164 };

referenceCanvas.width = canvasDimensions.width;
referenceCanvas.height = canvasDimensions.height;
farCanvas.width = canvasDimensions.width;
farCanvas.height = canvasDimensions.height;

const scale = (canvasDimensions.width / image.width) * 0.5;
const focus = -100; // 500000000 // breaks down in vanilla canvas
const rotation = {
  x: image.width / 2,
  y: image.height / 2,
  angle: Math.PI,
};

const diff = -image.height * 1;

const mkImage = ({ x, y, image }) => ({
  x,
  y,
  data: image.data,
  width: image.width,
  height: image.height,
});

const images = [
  mkImage({ x: 0, y: focus - 2 * image.height, image }),
  mkImage({ x: 0, y: focus - 1 * image.height, image }),
  mkImage({ x: 0, y: focus + 0 * image.height, image }),
  mkImage({ x: 0, y: focus + 1 * image.height, image }),
  mkImage({ x: 0, y: focus + 2 * image.height, image }),
  mkImage({ x: 0, y: focus + 3 * image.height, image }),
  mkImage({ x: 0, y: focus + 4 * image.height, image }),
];

const rectangles = [
  { x: 10, y: focus - 200, width: 200, height: 30 },
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
  { x: 0, y: -focus - diff, scale: scale, rotation: rotation }
);
const contextFar = getFarContext2d(document.getElementById("far"), {
  x: 0,
  y: -focus - diff,
  scale: scale,
  rotation: rotation,
});

image.data.onload = function () {
  function render(ctx) {
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
    // focus y
    ctx.save();

    ctx.beginPath();
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#0ac";
    ctx.moveTo(-2 * image.width, focus);
    ctx.lineTo(2 * image.width, focus);

    ctx.stroke();
    ctx.restore();

    // origo
    ctx.save();

    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#f00";
    const size = 16;
    ctx.arc(0, 0, size, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = "#0f0";
    ctx.moveTo(0, 0);
    ctx.lineTo(2 * size, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = "#00f";
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 2 * size);
    ctx.stroke();

    ctx.restore();
  }

  render(contextReference);
  render(contextFar);
};
image.data.src =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Saturn_from_Cassini_Orbiter_%282004-10-06%29.jpg/320px-Saturn_from_Cassini_Orbiter_%282004-10-06%29.jpg";
