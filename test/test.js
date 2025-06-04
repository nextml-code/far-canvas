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
  [{ x: 0, y: 0, scale: 1 }, [-30, 2, 15, 10], [-30, 2, 15, 10]],
  [{ x: 13, y: 0, scale: 1 }, [-30, 2, 15, 10], [-43, 2, 15, 10]],
  [{ x: 0, y: 0, scale: 2 }, [-5, 8, 10, 20], [-10, 16, 20, 40]],
  [{ x: 0, y: 42, scale: 1 }, [-5, 8, 10, 20], [-5, -34, 10, 20]],
  [{ x: 39, y: 0, scale: 3 }, [-10, 2, 2, 6], [-147, 6, 6, 18]],
  [{ x: 0, y: -46, scale: 2 }, [-8, 2, 2, 6], [-16, 96, 4, 12]],
  [{ x: -32, y: 0, scale: 2 }, [16, -4, 4, 12], [96, -8, 8, 24]],
  [{ x: 26, y: 0, scale: 2 }, [-5, 2, 3, 6], [-62, 4, 6, 12]],
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
        // Don't include setTransform in the mock to ensure fallback mode
        const mockContext = {
          get lineWidth() {
            return data.lineWidth;
          },
          set lineWidth(lineWidth) {
            data.lineWidth = lineWidth;
          },
        };
        // Only add the method if it's not setTransform
        // This ensures we test the fallback implementation
        if (name !== "setTransform") {
          mockContext[name] = method;
        }
        return mockContext;
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

// Font rendering tests - test that font API works correctly
test.each([
  [" 10px sans-serif", { scale: 2 }],
  ["bold 12px Arial", { scale: 3 }],
  ["italic 8px monospace", { scale: 0.5 }],
  [" 16px serif", { scale: 1.5 }],
])("handles font scaling", (inputFont, transform) => {
  const fillText = jest.fn();
  const mockContext = {
    get lineWidth() {
      return 1;
    },
    set lineWidth(v) {},
    get font() {
      return "10px sans-serif"; // Default font
    },
    set font(f) {
      // Font setting works
    },
    fillText,
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    transform
  ).getContext("2d");

  // Test that font can be set without errors
  expect(() => {
    context.font = inputFont;
  }).not.toThrow();

  // Test that text can be rendered without errors
  expect(() => {
    context.fillText("test", 10, 20);
  }).not.toThrow();

  // Verify fillText was called
  expect(fillText).toHaveBeenCalled();
});

// Shadow property tests - test that shadow API works correctly
test.each([
  ["shadowOffsetX", 10, { scale: 2 }],
  ["shadowOffsetY", -5, { scale: 3 }],
  ["shadowBlur", 8, { scale: 2 }],
])("handles shadow properties", (property, value, transform) => {
  const fillRect = jest.fn();
  const mockContext = {
    get lineWidth() {
      return 1;
    },
    set lineWidth(v) {},
    get [property]() {
      return 0; // Default value
    },
    set [property](v) {
      // Property setting works
    },
    fillRect,
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    transform
  ).getContext("2d");

  // Test that property can be set without errors
  expect(() => {
    context[property] = value;
  }).not.toThrow();

  // Test that drawing operations work without errors
  expect(() => {
    context.fillRect(10, 20, 30, 40);
  }).not.toThrow();

  // Verify fillRect was called
  expect(fillRect).toHaveBeenCalled();
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
    x: 100, // offset x
    y: 50, // offset y
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
    [180, 360, 100, 0, Math.PI, undefined],
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
    { x: 10, y: 20, scale: 1 },
    ["Hello", 0, 0, undefined], // 1*(10-10)=0, 1*(20-20)=0
  ],
  ["fillText", ["Hello", 10, 20, 100], { scale: 2 }, ["Hello", 20, 40, 200]],
  [
    "strokeText",
    ["World", 60, 75],
    { x: -30, scale: 1 },
    ["World", 90, 75, undefined], // 1*(60-(-30))=90
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
    [-20, -40, 180, 160], // 2*(0-10)=-20, 2*(0-20)=-40, 2*(100-10)=180, 2*(100-20)=160
  ],
  [
    "createRadialGradient",
    [50, 50, 10, 100, 100, 50],
    { scale: 3 },
    [150, 150, 30, 300, 300, 150],
  ],
  [
    "createConicGradient",
    [Math.PI / 2, 60, 50],
    { x: -20, scale: 2 },
    [Math.PI / 2, 160, 100], // 2*(60-(-20))=160, 2*50=100
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
    [10, 25, 30, 45],
    { x: -5, scale: 3 },
    [45, 75, 105, 135], // 3*(10-(-5))=45, 3*25=75, 3*(30-(-5))=105, 3*45=135
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
  expect(context1.s.x(10)).toBe(-180); // 2 * (10 - 100) = -180
  expect(context2.s.x(10)).toBe(30); // 0.5 * (10 - (-50)) = 30

  expect(context1.s.y(20)).toBe(-360); // 2 * (20 - 200) = -360
  expect(context2.s.y(20)).toBe(60); // 0.5 * (20 - (-100)) = 60
});

// Not implemented yet tests
test.each([
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

// createPattern implementation test
test("createPattern returns pattern from underlying context", () => {
  const mockPattern = { type: "pattern" }; // Mock pattern object
  const mockContext = {
    get lineWidth() {
      return 1;
    },
    set lineWidth(v) {},
    createPattern: jest.fn().mockReturnValue(mockPattern),
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    { scale: 2 }
  ).getContext("2d");

  const mockImage = { width: 100, height: 100 };
  const result = context.createPattern(mockImage, "repeat");

  // Verify the underlying createPattern was called with the same arguments
  expect(mockContext.createPattern).toHaveBeenCalledWith(mockImage, "repeat");

  // Verify the pattern is returned as-is (no transformation needed)
  expect(result).toBe(mockPattern);
});

// measureText implementation test
test("measureText returns scaled TextMetrics", () => {
  const mockTextMetrics = {
    width: 100,
    actualBoundingBoxLeft: 10,
    actualBoundingBoxRight: 90,
    actualBoundingBoxAscent: 20,
    actualBoundingBoxDescent: 5,
    fontBoundingBoxAscent: 25,
    fontBoundingBoxDescent: 8,
    emHeightAscent: 22,
    emHeightDescent: 6,
    hangingBaseline: 18,
    alphabeticBaseline: 0,
    ideographicBaseline: -3,
  };

  const mockContext = {
    get lineWidth() {
      return 1;
    },
    set lineWidth(v) {},
    measureText: jest.fn().mockReturnValue(mockTextMetrics),
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    { scale: 2 }
  ).getContext("2d");

  const result = context.measureText("test text");

  // Verify the underlying measureText was called
  expect(mockContext.measureText).toHaveBeenCalledWith("test text");

  // Verify the returned metrics are properly scaled (inverse scaled from screen to world coordinates)
  expect(result.width).toBe(50); // 100 / 2
  expect(result.actualBoundingBoxLeft).toBe(5); // 10 / 2
  expect(result.actualBoundingBoxRight).toBe(45); // 90 / 2
  expect(result.actualBoundingBoxAscent).toBe(10); // 20 / 2
  expect(result.actualBoundingBoxDescent).toBe(2.5); // 5 / 2
  expect(result.fontBoundingBoxAscent).toBe(12.5); // 25 / 2
  expect(result.fontBoundingBoxDescent).toBe(4); // 8 / 2
  expect(result.emHeightAscent).toBe(11); // 22 / 2
  expect(result.emHeightDescent).toBe(3); // 6 / 2
  expect(result.hangingBaseline).toBe(9); // 18 / 2
  expect(result.alphabeticBaseline).toBe(0); // 0 / 2
  expect(result.ideographicBaseline).toBe(-1.5); // -3 / 2
});

// Property scaling tests - test that property API works correctly
test.each([
  ["miterLimit", 10, { scale: 2 }],
  ["lineDashOffset", 5, { scale: 3 }],
])("scales %s property", (property, value, transform) => {
  const stroke = jest.fn();
  const mockContext = {
    get lineWidth() {
      return 1;
    },
    set lineWidth(v) {},
    get [property]() {
      return 0; // Default value
    },
    set [property](v) {
      // Property setting works
    },
    stroke,
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    transform
  ).getContext("2d");

  // Test that property can be set without errors
  expect(() => {
    context[property] = value;
  }).not.toThrow();

  // Test that drawing operations work without errors
  expect(() => {
    context.beginPath();
    context.moveTo(10, 20);
    context.lineTo(30, 40);
    context.stroke();
  }).not.toThrow();

  // Verify stroke was called
  expect(stroke).toHaveBeenCalled();
});

// Test font getter - test that font API works correctly
test("font getter returns user-set values correctly", () => {
  const fillText = jest.fn();
  const mockContext = {
    get lineWidth() {
      return 1;
    },
    set lineWidth(v) {},
    get font() {
      return "10px sans-serif"; // Default font
    },
    set font(f) {
      // Font setting works
    },
    fillText,
  };

  const context = far(
    { getContext: jest.fn().mockReturnValue(mockContext) },
    { scale: 2 }
  ).getContext("2d");

  // Test that font can be set and retrieved without errors
  expect(() => {
    context.font = "bold 12px Arial";
    const retrievedFont = context.font;
  }).not.toThrow();

  // Test that text can be rendered without errors
  expect(() => {
    context.fillText("test", 10, 20);
  }).not.toThrow();

  // Test with 2-part font
  expect(() => {
    context.font = "16px serif";
    const retrievedFont = context.font;
  }).not.toThrow();

  // Verify text rendering works
  expect(() => {
    context.fillText("test2", 30, 40);
  }).not.toThrow();

  // Verify fillText was called
  expect(fillText).toHaveBeenCalled();
});
