function getReferenceContext2d(element, d = {dx: 0, dy: 0, scale: 1}) {
  const ctx = element.getContext("2d");
  ctx.scale(scale, scale);
  ctx.translate(d.x, d.y);
  return ctx;
};

const canvasDimensions = {width: 500, height: 400};

const reference = document.getElementById('reference');
const far = document.getElementById('far');

reference.width = canvasDimensions.width;
reference.height = canvasDimensions.height;
far.width = canvasDimensions.width;
far.height = canvasDimensions.height;

const image = {data: document.createElement('img'), width: 200, height: 158};

const focus = 100000000; // NOTE 500000000 breaks down in vanilla canvas
const scale = 1.5;

const mkImage = ({x, y, image}) => ({ x , y, data: image.data, width: image.width, height: image.height});

const images = [
    mkImage({ x: 0, y: focus - 1*image.height, image}),
	mkImage({ x: 0, y: focus + 0*image.height, image}),
    mkImage({ x: 0, y: focus + 1*image.height, image}),
    mkImage({ x: 0, y: focus + 2*image.height, image}),
];

const rectangles = [
	{x: 10, y: focus + 20, width: 200, height: 30},
    {x: 100, y: focus + 250, width: 200, height: 30},
];

var ctxReference = getReferenceContext2d(
	document.getElementById('reference'),
    {x: 0, y: -focus, scale: scale}
);
var ctxFar = getFarContext2d(
	document.getElementById('far'),
    {x: 0, y: -focus, scale: scale}
 );

image.data.onload = function () {
	function render(ctx) {
    	images.forEach(image => {
            ctx.save();
            ctx.drawImage(image.data, image.x, image.y, image.width, image.height);
            ctx.restore();
        });
        rectangles.forEach(rectangle => {
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
            ctx.restore();
        });
    }

    render(ctxReference);
    render(ctxFar);

}
image.data.src = "http://i.imgur.com/gwlPu.jpg";


console.log(
	ctxFar.s.inv.x(ctxFar.s.x(1234)),
    ctxFar.s.inv.y(ctxFar.s.y(1234)),
	ctxFar.s.inv.distance(ctxFar.s.distance(1234)),
    ctxFar.s.x(ctxFar.s.inv.x(1234)),
    ctxFar.s.y(ctxFar.s.inv.y(1234)),
	ctxFar.s.distance(ctxFar.s.inv.distance(1234)),
);
