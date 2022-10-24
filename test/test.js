const { far } = require("../lib/index.js");


test.each([
    [{}, 128],
    [{}, -64],
    [{}, 0],
    [{ scale: 5 }, 128],
    [{ scale: 6 }, -64],
    [{ scale: 7 }, 0],
    [{ x: -1337 }, 128],
    [{ x: 1337 }, -64],
    [{ x: 13 }, 0],
    [{ scale: 5, y: -1337 }, 128],
    [{ scale: 6, y: 1337 }, -64],
    [{ scale: 7, y: 13 }, 0],
])(
    "s.inv is inverse",
    (transform, t) => {
        let numDigits = 7;

        let context = far(
            {
                getContext: jest.fn().mockReturnValue(undefined),
            },
            transform
        ).getContext("2d");

        expect(context.s.x(context.s.inv.x(t))).toBeCloseTo(t, numDigits);
        expect(context.s.y(context.s.inv.y(t))).toBeCloseTo(t, numDigits);
        expect(context.s.distance(context.s.inv.distance(t))).toBeCloseTo(t, numDigits);
        expect(context.s.inv.x(context.s.x(t))).toBeCloseTo(t, numDigits);
        expect(context.s.inv.y(context.s.y(t))).toBeCloseTo(t, numDigits);
        expect(context.s.inv.distance(context.s.distance(t))).toBeCloseTo(t, numDigits);
    }
);

test.each([
    undefined,
    {},
    { x: -1337 },
    { x: 1337, scale: 3 },
])(
    "calls canvas.getContext",
    (transform) => {
    const getContext = jest.fn();
    const context = far(
        {
            getContext,
        },
        transform
    ).getContext("2d");

    expect(getContext).toHaveBeenCalledTimes(1);
    expect(getContext).toHaveBeenCalledWith("2d");
});

test.each([
    [undefined, [ 0, 0, 20, 10], [ 0, 0, 20, 10 ]],
    [{}, [ -10, 0, 35, 10], [ -10, 0, 35, 10 ]],
    [{ x: -13 }, [-30, 2, 15, 10], [-43, 2, 15, 10]],
    [{ y: 42 }, [-5, 8, 10, 20], [-5, 50, 10, 20]],
    [{ x: 13, scale: 3 }, [-8, 2, 2, 6], [15, 6, 6, 18]],
    [{ y: -23, scale: 2 }, [-8, 2, 2, 6], [-16, -42, 4, 12]],
    [{ x: 8, scale: 4 }, [8, -2, 2, 6], [64, -8, 8, 24]],
    [{ x: 13, scale: 2 }, [-15, 2, 3, 6], [-4, 4, 6, 12]],

])(
    "transforms",
    (transform, rectangle, rectangleTransformed) => {
    const drawImage = jest.fn();
    const context = far(
        {
            getContext() {
                return {
                    drawImage,
                };
            },
        },
        transform
    ).getContext("2d");

    context.drawImage("image", ...rectangle);
    expect(drawImage).toHaveBeenCalledTimes(1);
    expect(drawImage).toHaveBeenCalledWith("image", ...rectangleTransformed);

});

test.each([
    ["transform", []],
    ["translate", []],
    ["scale", []],
])(
    "not supported transform operations",
    (methodName, methodArgs) => {
        const method = jest.fn();
        const context = far(
            {
                getContext() {
                    return {
                        methodName: method,
                    };
                },
            },
            { x: 3, y: 0, scale: 1.5}
        ).getContext("2d");

        expect(() => context[methodName](...methodArgs)).toThrow()

    }
)

test.each([
    ["lineWidth", { scale: 2 }, 4 , 8 ],
])(
    "get/set width",
    (attributeName, transform, value, valueTransformed) => {
        let numDigits = 7;

        const attribute = jest.fn().mockReturnValue();
        const context = far(
            {
                getContext() {
                    return {
                        get [attributeName]() {
                            return attribute();
                        },
                        set [attributeName](parameter) {
                            return attribute(parameter);
                        }
                    };
                },
            },
            transform
        ).getContext("2d");

        context[attributeName] = value;
        expect(attribute).toHaveBeenCalledTimes(1);
        expect(attribute).toHaveBeenCalledWith(valueTransformed);
    }
)

/*
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
    mkImage({ x: 0, y: focus - 1*image.height, image }),
	mkImage({ x: 0, y: focus + 0*image.height, image }),
    mkImage({ x: 0, y: focus + 1*image.height, image }),
    mkImage({ x: 0, y: focus + 2*image.height, image }),
];

const rectangles = [
	{ x: 10, y: focus + 20, width: 200, height: 30 },
    { x: 100, y: focus + 250, width: 200, height: 30 },
];

var ctxReference = getReferenceContext2d(
	document.getElementById('reference'),
    { x: 0, y: -focus, scale: scale }
);
var ctxFar = getFarContext2d(
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
*/
