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
