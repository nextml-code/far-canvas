const { far } = require("../lib.cjs/index.js");

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
])("s.inv is inverse", (transform, t) => {
  let numDigits = 7;

  const data = { lineWidth: 1 };
  const mockContext = {
    get lineWidth() {
      return data.lineWidth;
    },
    set lineWidth(lineWidth) {
      data.lineWidth = lineWidth;
    },
  };

  let context = far(
    {
      getContext: jest.fn().mockReturnValue(mockContext),
    },
    transform
  ).getContext("2d");

  expect(context.s.x(context.s.inv.x(t))).toBeCloseTo(t, numDigits);
  expect(context.s.y(context.s.inv.y(t))).toBeCloseTo(t, numDigits);
  expect(context.s.distance(context.s.inv.distance(t))).toBeCloseTo(
    t,
    numDigits
  );
  expect(context.s.inv.x(context.s.x(t))).toBeCloseTo(t, numDigits);
  expect(context.s.inv.y(context.s.y(t))).toBeCloseTo(t, numDigits);
  expect(context.s.inv.distance(context.s.distance(t))).toBeCloseTo(
    t,
    numDigits
  );
});

test.each([undefined, {}, { x: -1337 }, { x: 1337, scale: 3 }])(
  "calls canvas.getContext",
  (transform) => {
    const data = { lineWidth: 1 };
    const mockContext = {
      get lineWidth() {
        return data.lineWidth;
      },
      set lineWidth(lineWidth) {
        data.lineWidth = lineWidth;
      },
    };
    const getContext = jest.fn().mockReturnValue(mockContext);

    const context = far(
      {
        getContext,
      },
      transform
    ).getContext("2d");

    expect(getContext).toHaveBeenCalledTimes(1);
    expect(getContext).toHaveBeenCalledWith("2d");
  }
);

test.each([
  [undefined, [0, 0, 20, 10], [0, 0, 20, 10]],
  [{}, [-10, 0, 35, 10], [-10, 0, 35, 10]],
  [{ x: -13 }, [-30, 2, 15, 10], [-43, 2, 15, 10]],
  [{ y: 42 }, [-5, 8, 10, 20], [-5, 50, 10, 20]],
  [{ x: 13, scale: 3 }, [-8, 2, 2, 6], [15, 6, 6, 18]],
  [{ y: -23, scale: 2 }, [-8, 2, 2, 6], [-16, -42, 4, 12]],
  [{ x: 8, scale: 4 }, [8, -2, 2, 6], [64, -8, 8, 24]],
  [{ x: 13, scale: 2 }, [-15, 2, 3, 6], [-4, 4, 6, 12]],
])("transforms", (transform, rectangle, rectangleTransformed) => {
  const drawImage = jest.fn();
  const context = far(
    {
      getContext() {
        var data = { lineWidth: 1 };
        return {
          drawImage,
          get lineWidth() {
            return data.lineWidth;
          },
          set lineWidth(lineWidth) {
            data.lineWidth = lineWidth;
          },
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
  ["getTransform", []],
  ["setTransform", []],
  ["resetTransform", []],
  ["translate", []],
  ["scale", []],
  ["rotate", []],
])("not supported transform operations", (name, args) => {
  const method = jest.fn();
  const context = far(
    {
      getContext() {
        const data = { lineWidth: 1 };
        return {
          [name]: method,
          get lineWidth() {
            return data.lineWidth;
          },
          set lineWidth(lineWidth) {
            data.lineWidth = lineWidth;
          },
        };
      },
    },
    { x: 3, y: 0, scale: 1.5 }
  ).getContext("2d");

  const contextMethod = context[name];

  expect(() => contextMethod(...args)).toThrow();
});

test.each([
  ["save", []],
  ["restore", []],
  ["beginPath", []],
  ["closePath", []],
  ["getContextAttributes", []],
])("method just wrapped", (name, args) => {
  const method = jest.fn().mockReturnValue("return");
  const context = far(
    {
      getContext() {
        const data = { lineWidth: 1 };
        return {
          [name]: method,
          get lineWidth() {
            return data.lineWidth;
          },
          set lineWidth(lineWidth) {
            data.lineWidth = lineWidth;
          },
        };
      },
    },
    { x: 3, y: 0, scale: 1.5 }
  ).getContext("2d");
  context[name](...args);
  expect(method).toHaveBeenCalledTimes(1);
  expect(method).toHaveBeenCalledWith(...args);
  expect(method).toReturnWith("return");
});

test.each([[{ scale: 2 }, 4, 8]])(
  "get/set width",
  (transform, value, valueTransformed) => {
    let numDigits = 7;

    const attribute = jest.fn().mockReturnValue(value);
    const context = far(
      {
        getContext() {
          const data = { lineWidth: 1 };

          return {
            get lineWidth() {
              return attribute();
            },
            set lineWidth(parameter) {
              return attribute(parameter);
            },
          };
        },
      },
      transform
    ).getContext("2d");

    expect(attribute).toHaveBeenCalledTimes(2); // NOTE get + set in init
    context.lineWidth = value;
    expect(attribute).toHaveBeenCalledTimes(3);
    expect(attribute).toHaveBeenCalledWith(valueTransformed);
  }
);

test.each(["clearCanvas", "canvasDimensions", "s"])("exists", (name) => {
  const context = far(
    {
      getContext() {
        const data = { lineWidth: 1 };
        return {
          get lineWidth() {
            return data.lineWidth;
          },
          set lineWidth(lineWidth) {
            data.lineWidth = lineWidth;
          },
        };
      },
    },
    { x: 3, y: 0, scale: 1.5 }
  ).getContext("2d");

  expect(context).toHaveProperty(name);
});

// Edge case tests
test.each([
  [{ scale: 0.1 }, 100, 10], // Very small scale
  [{ scale: 100 }, 1, 100], // Very large scale
  [{ scale: -2 }, 10, -20], // Negative scale
  [{ x: 1e9, y: 1e9 }, 0, 0], // Extreme offsets
  [{ x: -1e9, y: -1e9 }, 0, 0], // Extreme negative offsets
])("handles edge case transforms", (transform, input, expected) => {
  const data = { lineWidth: 1 };
  const mockContext = {
    get lineWidth() {
      return data.lineWidth;
    },
    set lineWidth(lineWidth) {
      data.lineWidth = lineWidth;
    },
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    transform
  ).getContext("2d");

  if (transform.scale !== undefined) {
    expect(context.s.distance(input)).toBeCloseTo(expected, 5);
  }
});

// Font property tests
test.each([
  ["10px sans-serif", { scale: 2 }, " 20px sans-serif"],
  ["bold 12px Arial", { scale: 3 }, "bold 36px Arial"],
  ["italic 8px monospace", { scale: 0.5 }, "italic 4px monospace"],
  ["16px serif", { scale: 1.5 }, " 24px serif"],
])("handles font scaling", (inputFont, transform, expectedFont) => {
  let storedFont = "10px sans-serif";
  const mockContext = {
    get lineWidth() {
      return 1;
    },
    set lineWidth(v) {},
    get font() {
      return storedFont;
    },
    set font(f) {
      storedFont = f;
    },
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    transform
  ).getContext("2d");

  context.font = inputFont;
  expect(storedFont).toBe(expectedFont);
});

// Shadow property tests
test.each([
  ["shadowOffsetX", 10, { scale: 2 }, 20],
  ["shadowOffsetY", -5, { scale: 3 }, -15],
  ["shadowBlur", 8, { scale: 2 }, 8], // shadowBlur should NOT be scaled
])("handles shadow properties", (property, value, transform, expected) => {
  const data = { [property]: 0, lineWidth: 1 };
  const mockContext = {
    get lineWidth() {
      return data.lineWidth;
    },
    set lineWidth(v) {
      data.lineWidth = v;
    },
    get [property]() {
      return data[property];
    },
    set [property](v) {
      data[property] = v;
    },
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    transform
  ).getContext("2d");

  context[property] = value;
  expect(data[property]).toBe(expected);
});

// Canvas dimensions test
test("calculates canvas dimensions correctly", () => {
  const mockCanvas = {
    width: 800,
    height: 600,
    getContext: jest.fn().mockReturnValue({
      get lineWidth() {
        return 1;
      },
      set lineWidth(v) {},
    }),
  };

  const context = far(mockCanvas, { x: 100, y: 50, scale: 2 }).getContext("2d");

  expect(context.canvasDimensions).toEqual({
    x: -100,
    y: -50,
    width: 400,
    height: 300,
  });
});

// Arc and ellipse method tests
test.each([
  [
    "arc",
    [100, 200, 50, 0, Math.PI],
    { x: 10, y: 20, scale: 2 },
    [220, 440, 100, 0, Math.PI, undefined],
  ],
  [
    "ellipse",
    [50, 60, 20, 30, 0, 0, Math.PI * 2],
    { scale: 3 },
    [150, 180, 60, 90, 0, 0, Math.PI * 2, undefined],
  ],
])("transforms %s method", (method, args, transform, expected) => {
  const mockMethod = jest.fn();
  const mockContext = {
    [method]: mockMethod,
    get lineWidth() {
      return 1;
    },
    set lineWidth(v) {},
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    transform
  ).getContext("2d");

  context[method](...args);
  expect(mockMethod).toHaveBeenCalledWith(...expected);
});

// Text method tests
test.each([
  [
    "fillText",
    ["Hello", 10, 20],
    { x: 5, y: 10, scale: 2 },
    ["Hello", 30, 60, undefined],
  ],
  ["fillText", ["Hello", 10, 20, 100], { scale: 2 }, ["Hello", 20, 40, 200]],
  [
    "strokeText",
    ["World", 15, 25],
    { x: -5, scale: 3 },
    ["World", 30, 75, undefined],
  ],
  [
    "strokeText",
    ["World", 15, 25, 50],
    { scale: 0.5 },
    ["World", 7.5, 12.5, 25],
  ],
])("transforms %s method", (method, args, transform, expected) => {
  const mockMethod = jest.fn();
  const mockContext = {
    [method]: mockMethod,
    get lineWidth() {
      return 1;
    },
    set lineWidth(v) {},
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    transform
  ).getContext("2d");

  context[method](...args);
  expect(mockMethod).toHaveBeenCalledWith(...expected);
});

// Gradient method tests
test.each([
  [
    "createLinearGradient",
    [0, 0, 100, 100],
    { x: 10, y: 20, scale: 2 },
    [20, 40, 220, 240],
  ],
  [
    "createRadialGradient",
    [50, 50, 10, 100, 100, 50],
    { scale: 3 },
    [150, 150, 30, 300, 300, 150],
  ],
  [
    "createConicGradient",
    [Math.PI / 2, 50, 50],
    { x: -10, scale: 2 },
    [Math.PI / 2, 80, 100],
  ],
])("transforms %s method", (method, args, transform, expected) => {
  const mockMethod = jest.fn().mockReturnValue({});
  const mockContext = {
    [method]: mockMethod,
    get lineWidth() {
      return 1;
    },
    set lineWidth(v) {},
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    transform
  ).getContext("2d");

  context[method](...args);
  expect(mockMethod).toHaveBeenCalledWith(...expected);
});

// Line dash tests
test("handles line dash methods", () => {
  const data = { lineDash: [], lineWidth: 1 };
  const mockContext = {
    getLineDash: jest.fn(() => data.lineDash),
    setLineDash: jest.fn((v) => {
      data.lineDash = v;
    }),
    get lineWidth() {
      return data.lineWidth;
    },
    set lineWidth(v) {
      data.lineWidth = v;
    },
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    { scale: 2 }
  ).getContext("2d");

  // Set line dash
  context.setLineDash([5, 10, 15]);
  expect(mockContext.setLineDash).toHaveBeenCalledWith([10, 20, 30]);

  // Get line dash
  data.lineDash = [20, 40, 60];
  const result = context.getLineDash();
  expect(result).toEqual([10, 20, 30]);
});

// Clear canvas test
test("clearCanvas clears entire canvas", () => {
  const mockContext = {
    save: jest.fn(),
    restore: jest.fn(),
    setTransform: jest.fn(),
    clearRect: jest.fn(),
    canvas: { width: 800, height: 600 },
    get lineWidth() {
      return 1;
    },
    set lineWidth(v) {},
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    { x: 100, y: 200, scale: 2 }
  ).getContext("2d");

  context.clearCanvas();

  expect(mockContext.save).toHaveBeenCalled();
  expect(mockContext.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
  expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
  expect(mockContext.restore).toHaveBeenCalled();
});

// Bezier curve tests
test.each([
  [
    "bezierCurveTo",
    [10, 20, 30, 40, 50, 60],
    { scale: 2 },
    [20, 40, 60, 80, 100, 120],
  ],
  [
    "quadraticCurveTo",
    [15, 25, 35, 45],
    { x: 5, scale: 3 },
    [60, 75, 120, 135],
  ],
])("transforms %s method", (method, args, transform, expected) => {
  const mockMethod = jest.fn();
  const mockContext = {
    [method]: mockMethod,
    get lineWidth() {
      return 1;
    },
    set lineWidth(v) {},
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    transform
  ).getContext("2d");

  context[method](...args);
  expect(mockMethod).toHaveBeenCalledWith(...expected);
});

// Error handling tests
test("throws error for non-2d context", () => {
  const mockCanvas = {
    getContext: jest.fn(),
  };

  expect(() => {
    far(mockCanvas).getContext("webgl");
  }).toThrow('getContext(contextType != "2d") not implemented');
});

test("throws error for 2d context with attributes", () => {
  const mockCanvas = {
    getContext: jest.fn(),
  };

  expect(() => {
    far(mockCanvas).getContext("2d", { alpha: false });
  }).toThrow('getContext(contextType != "2d") not implemented');
});

// Property passthrough tests
test.each([
  ["fillStyle", "#ff0000"],
  ["strokeStyle", "rgba(0,0,255,0.5)"],
  ["globalAlpha", 0.5],
  ["globalCompositeOperation", "multiply"],
  ["textAlign", "center"],
  ["textBaseline", "middle"],
  ["direction", "rtl"],
  ["imageSmoothingEnabled", false],
  ["imageSmoothingQuality", "high"],
  ["lineCap", "round"],
  ["lineJoin", "bevel"],
  ["shadowColor", "#000000"],
])("passes through %s property", (property, value) => {
  const data = { [property]: null, lineWidth: 1 };
  const mockContext = {
    get [property]() {
      return data[property];
    },
    set [property](v) {
      data[property] = v;
    },
    get lineWidth() {
      return data.lineWidth;
    },
    set lineWidth(v) {
      data.lineWidth = v;
    },
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    { scale: 2 }
  ).getContext("2d");

  context[property] = value;
  expect(context[property]).toBe(value);
});

// Multiple coordinate system tests
test("coordinate systems work independently", () => {
  const mockCanvas = {
    getContext: jest.fn().mockReturnValue({
      get lineWidth() {
        return 1;
      },
      set lineWidth(v) {},
    }),
  };

  const context1 = far(mockCanvas, { x: 100, y: 200, scale: 2 }).getContext(
    "2d"
  );
  const context2 = far(mockCanvas, { x: -50, y: -100, scale: 0.5 }).getContext(
    "2d"
  );

  // Test that each context has its own coordinate system
  expect(context1.s.x(10)).toBe(220); // 2 * (10 + 100)
  expect(context2.s.x(10)).toBe(-20); // 0.5 * (10 - 50)

  expect(context1.s.y(20)).toBe(440); // 2 * (20 + 200)
  expect(context2.s.y(20)).toBe(-40); // 0.5 * (20 - 100)
});

// Not implemented yet tests
test.each([
  ["createPattern", ["image", "repeat"], "not implemented"],
  ["measureText", ["text"], "not implemented"],
  ["getImageData", [0, 0, 100, 100], "not implemented"],
  ["putImageData", ["imageData", 0, 0], "not implemented"],
  ["drawFocusIfNeeded", ["element"], "not implemented"],
  ["isPointInPath", [10, 20], "not implemented"],
  ["isPointInStroke", [10, 20], "not implemented"],
])(
  "throws not implemented for %s",
  (method, args = [], errorSubstring = "not implemented") => {
    const mockContext = {
      get lineWidth() {
        return 1;
      },
      set lineWidth(v) {},
    };

    const context = far(
      { getContext: jest.fn().mockReturnValue(mockContext) },
      {}
    ).getContext("2d");

    expect(() => context[method](...args)).toThrow(errorSubstring);
  }
);

// Special test for filter property that throws on getter
test("throws not implemented for filter property", () => {
  const mockContext = {
    get lineWidth() {
      return 1;
    },
    set lineWidth(v) {},
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    {}
  ).getContext("2d");

  // Filter throws on getter access
  expect(() => context.filter).toThrow("not implemented yet");
  expect(() => (context.filter = "blur(5px)")).toThrow("not implemented yet");
});

// Additional property tests
test.each([
  ["miterLimit", 10, { scale: 2 }, 20],
  ["lineDashOffset", 5, { scale: 3 }, 15],
])("scales %s property", (property, value, transform, expected) => {
  const data = { [property]: 0, lineWidth: 1 };
  const mockContext = {
    get lineWidth() {
      return data.lineWidth;
    },
    set lineWidth(v) {
      data.lineWidth = v;
    },
    get [property]() {
      return data[property];
    },
    set [property](v) {
      data[property] = v;
    },
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    transform
  ).getContext("2d");

  context[property] = value;
  expect(data[property]).toBe(expected);
  expect(context[property]).toBe(value);
});

// Additional method tests
test.each([
  ["arcTo", [10, 20, 30, 40, 5], { x: 5, scale: 2 }, [30, 40, 70, 80, 10]],
  ["roundRect", [10, 20, 30, 40, 5], { scale: 3 }, [30, 60, 90, 120, 15]],
  ["rect", [10, 20, 30, 40], { x: -5, y: -10, scale: 2 }, [10, 20, 60, 80]],
])("transforms %s method", (method, args, transform, expected) => {
  const mockMethod = jest.fn();
  const mockContext = {
    [method]: mockMethod,
    get lineWidth() {
      return 1;
    },
    set lineWidth(v) {},
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    transform
  ).getContext("2d");

  context[method](...args);
  expect(mockMethod).toHaveBeenCalledWith(...expected);
});

// Rectangle methods test
test.each([
  ["fillRect", [10, 20, 30, 40], { scale: 2 }, [20, 40, 60, 80]],
  ["strokeRect", [15, 25, 35, 45], { x: 10, scale: 3 }, [75, 75, 105, 135]],
  ["clearRect", [5, 10, 20, 30], { y: -5, scale: 0.5 }, [2.5, 2.5, 10, 15]],
])("transforms %s method", (method, args, transform, expected) => {
  const mockMethod = jest.fn();
  const mockContext = {
    [method]: mockMethod,
    get lineWidth() {
      return 1;
    },
    set lineWidth(v) {},
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    transform
  ).getContext("2d");

  context[method](...args);
  expect(mockMethod).toHaveBeenCalledWith(...expected);
});

// Canvas property passthrough test
test("passes through canvas property", () => {
  const mockCanvas = { id: "test-canvas" };
  const mockContext = {
    canvas: mockCanvas,
    get lineWidth() {
      return 1;
    },
    set lineWidth(v) {},
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    {}
  ).getContext("2d");

  expect(context.canvas).toBe(mockCanvas);

  const newCanvas = { id: "new-canvas" };
  context.canvas = newCanvas;
  expect(mockContext.canvas).toBe(newCanvas);
});

// DrawImage edge cases
test("transforms drawImage with 2 args (uses image dimensions)", () => {
  const mockImage = { width: 100, height: 50 };
  const drawImage = jest.fn();
  const mockContext = {
    drawImage,
    get lineWidth() {
      return 1;
    },
    set lineWidth(v) {},
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    { x: 10, y: 20, scale: 2 }
  ).getContext("2d");

  context.drawImage(mockImage, 30, 40);
  expect(drawImage).toHaveBeenCalledWith(mockImage, 80, 120, 200, 100);
});

// Stroke method test
test("stroke method is wrapped", () => {
  const stroke = jest.fn();
  const mockContext = {
    stroke,
    get lineWidth() {
      return 1;
    },
    set lineWidth(v) {},
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    { scale: 2 }
  ).getContext("2d");

  context.stroke();
  expect(stroke).toHaveBeenCalledWith();
});

// CreateImageData test
test("transforms createImageData dimensions", () => {
  const createImageData = jest.fn().mockReturnValue({});
  const mockContext = {
    createImageData,
    get lineWidth() {
      return 1;
    },
    set lineWidth(v) {},
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    { scale: 2 }
  ).getContext("2d");

  const settings = { colorSpace: "srgb" };
  context.createImageData(100, 200, settings);
  expect(createImageData).toHaveBeenCalledWith(200, 400, settings);
});

// Edge case: zero dimensions
test("handles zero dimensions correctly", () => {
  const fillRect = jest.fn();
  const mockContext = {
    fillRect,
    get lineWidth() {
      return 1;
    },
    set lineWidth(v) {},
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    { scale: 2 }
  ).getContext("2d");

  context.fillRect(10, 20, 0, 0);
  expect(fillRect).toHaveBeenCalledWith(20, 40, 0, 0);
});

// Edge case: negative dimensions
test("handles negative dimensions correctly", () => {
  const fillRect = jest.fn();
  const mockContext = {
    fillRect,
    get lineWidth() {
      return 1;
    },
    set lineWidth(v) {},
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    { scale: 2 }
  ).getContext("2d");

  context.fillRect(10, 20, -30, -40);
  expect(fillRect).toHaveBeenCalledWith(20, 40, -60, -80);
});

// Test font getter
test("font getter inverse transforms correctly", () => {
  let storedFont = "10px sans-serif"; // This is the default initialization
  const mockContext = {
    get lineWidth() {
      return 1;
    },
    set lineWidth(v) {},
    get font() {
      return storedFont;
    },
    set font(f) {
      storedFont = f;
    },
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    { scale: 2 }
  ).getContext("2d");

  // After initialization, the font should be scaled
  storedFont = "20px sans-serif"; // This is what far-canvas would set

  // Now set a custom font
  context.font = "bold 12px Arial";
  expect(storedFont).toBe("bold 24px Arial");
  expect(context.font).toBe("bold 12px Arial");

  // Test with 2-part font
  context.font = "16px serif";
  expect(storedFont).toBe(" 32px serif");
  expect(context.font).toBe(" 16px serif");
});
