import { far } from "../lib/index.js";


function getReferenceContext2d(element, transform) {
    const context = element.getContext("2d");
    context.scale(transform.scale, transform.scale);
    context.translate(transform.x, transform.y);

    return context;
};

function getFarContext2d(element, transform) {
    const context = far(element, transform).getContext("2d");

    return context;
}

const referenceCanvas = document.getElementById('reference');
const farCanvas = document.getElementById('far');

const canvasDimensions = {width: 800, height: 600};

referenceCanvas.width = canvasDimensions.width;
referenceCanvas.height = canvasDimensions.height;
farCanvas.width = canvasDimensions.width;
farCanvas.height = canvasDimensions.height;

const image = {data: document.createElement('img'), width: 200, height: 158};

const focus = 100000000; // NOTE 500000000 breaks down in vanilla canvas
const scale = 1.5;

const mkImage = ({x, y, image}) => ({ x , y, data: image.data, width: image.width, height: image.height});

const images = [
    mkImage({ x: 0, y: focus - 1*image.height, image }),
	mkImage({ x: 0, y: focus + 0*image.height, image }),
    mkImage({ x: 0, y: focus + 1*image.height, image }),
    mkImage({ x: 0, y: focus + 2*image.height, image }),
];

const rectangles = [
	{ x: 10, y: focus + 20, width: 200, height: 30 },
    { x: 100, y: focus + 250, width: 200, height: 30 },
];

const contextReference = getReferenceContext2d(
	document.getElementById('reference'),
    { x: 0, y: -focus, scale: scale }
);
const contextFar = getFarContext2d(
	document.getElementById('far'),
    { x: 0, y: -focus, scale: scale }
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

    render(contextReference);
    render(contextFar);

}
image.data.src = "http://i.imgur.com/gwlPu.jpg";
