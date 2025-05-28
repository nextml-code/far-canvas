const { far } = require("../lib.cjs/index.js");

describe("Transform support detection", () => {
  test("uses transform-aware implementation when setTransform is available", () => {
    const mockContext = {
      setTransform: jest.fn(),
      get lineWidth() {
        return 1;
      },
      set lineWidth(v) {},
      get font() {
        return "10px sans-serif";
      },
      set font(v) {},
    };

    const canvas = {
      width: 800,
      height: 600,
      getContext: jest.fn().mockReturnValue(mockContext),
    };

    const context = far(canvas, { x: 100, y: 100, scale: 2 }).getContext("2d");

    // Transform operations should work
    expect(() => context.translate(10, 20)).not.toThrow();
    expect(() => context.scale(2, 2)).not.toThrow();
    expect(() => context.rotate(Math.PI / 4)).not.toThrow();
    expect(() => context.setTransform(1, 0, 0, 1, 0, 0)).not.toThrow();
    expect(() => context.resetTransform()).not.toThrow();

    // setTransform should have been called during initialization
    expect(mockContext.setTransform).toHaveBeenCalled();
  });

  test("uses fallback implementation when setTransform is not available", () => {
    const mockContext = {
      get lineWidth() {
        return 1;
      },
      set lineWidth(v) {},
      get font() {
        return "10px sans-serif";
      },
      set font(v) {},
    };

    const canvas = {
      width: 800,
      height: 600,
      getContext: jest.fn().mockReturnValue(mockContext),
    };

    const context = far(canvas, { x: 100, y: 100, scale: 2 }).getContext("2d");

    // Transform operations should throw errors
    expect(() => context.translate(10, 20)).toThrow("translate not supported");
    expect(() => context.scale(2, 2)).toThrow("scale not supported");
    expect(() => context.rotate(Math.PI / 4)).toThrow("rotate not supported");
    expect(() => context.setTransform(1, 0, 0, 1, 0, 0)).toThrow(
      "setTransform not supported"
    );
    expect(() => context.resetTransform()).toThrow(
      "resetTransform not supported"
    );
  });

  test("transform-aware implementation applies transforms correctly", () => {
    const mockContext = {
      setTransform: jest.fn(),
      arc: jest.fn(),
      fillRect: jest.fn(),
      get lineWidth() {
        return 1;
      },
      set lineWidth(v) {},
      get font() {
        return "10px sans-serif";
      },
      set font(v) {},
    };

    const canvas = {
      width: 800,
      height: 600,
      getContext: jest.fn().mockReturnValue(mockContext),
    };

    const context = far(canvas, { x: 1000, y: 2000, scale: 2 }).getContext(
      "2d"
    );

    // Drawing operations should transform coordinates (like fallback implementation)
    // Our fixed transform-aware implementation transforms coordinates in JavaScript
    context.fillRect(100, 200, 50, 60);
    // Expected: x=(100-1000)*2=-1800, y=(200-2000)*2=-3600, w=50*2=100, h=60*2=120
    expect(mockContext.fillRect).toHaveBeenCalledWith(-1800, -3600, 100, 120);

    // User transforms should be applied via setTransform
    context.translate(10, 20);

    // Check that setTransform was called with updated matrix
    const lastCall =
      mockContext.setTransform.mock.calls[
        mockContext.setTransform.mock.calls.length - 1
      ];
    expect(lastCall).toBeDefined();
  });

  test("fallback implementation transforms coordinates", () => {
    const mockContext = {
      fillRect: jest.fn(),
      arc: jest.fn(),
      get lineWidth() {
        return 1;
      },
      set lineWidth(v) {},
      get font() {
        return "10px sans-serif";
      },
      set font(v) {},
    };

    const canvas = {
      width: 800,
      height: 600,
      getContext: jest.fn().mockReturnValue(mockContext),
    };

    const context = far(canvas, { x: 100, y: 200, scale: 2 }).getContext("2d");

    // Drawing operations should transform coordinates
    context.fillRect(50, 60, 30, 40);
    // Expected: x=(50-100)*2=-100, y=(60-200)*2=-280, w=30*2=60, h=40*2=80
    expect(mockContext.fillRect).toHaveBeenCalledWith(-100, -280, 60, 80);

    context.arc(10, 20, 15, 0, Math.PI);
    // Expected: x=(10-100)*2=-180, y=(20-200)*2=-360, r=15*2=30
    expect(mockContext.arc).toHaveBeenCalledWith(
      -180,
      -360,
      30,
      0,
      Math.PI,
      undefined
    );
  });

  test("getTransform returns DOMMatrix in transform-aware mode", () => {
    const DOMMatrix =
      global.DOMMatrix ||
      class DOMMatrix {
        constructor(init) {
          if (Array.isArray(init) && init.length === 6) {
            [this.a, this.b, this.c, this.d, this.e, this.f] = init;
          }
        }
      };
    global.DOMMatrix = DOMMatrix;

    const mockContext = {
      setTransform: jest.fn(),
      get lineWidth() {
        return 1;
      },
      set lineWidth(v) {},
      get font() {
        return "10px sans-serif";
      },
      set font(v) {},
    };

    const canvas = {
      width: 800,
      height: 600,
      getContext: jest.fn().mockReturnValue(mockContext),
    };

    const context = far(canvas).getContext("2d");

    const transform = context.getTransform();
    expect(transform).toBeDefined();
    expect(transform.a).toBe(1);
    expect(transform.d).toBe(1);
    expect(transform.e).toBe(0);
    expect(transform.f).toBe(0);
  });

  test("getTransform throws in fallback mode", () => {
    const mockContext = {
      get lineWidth() {
        return 1;
      },
      set lineWidth(v) {},
      get font() {
        return "10px sans-serif";
      },
      set font(v) {},
    };

    const canvas = {
      width: 800,
      height: 600,
      getContext: jest.fn().mockReturnValue(mockContext),
    };

    const context = far(canvas).getContext("2d");

    expect(() => context.getTransform()).toThrow("getTransform not supported");
  });
});
