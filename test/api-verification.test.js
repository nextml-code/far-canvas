const { far } = require("../lib.cjs/index.js");
const { createCanvas } = require("canvas");

describe("API Verification Test", () => {
  function createTestCanvas(width = 400, height = 400) {
    return createCanvas(width, height);
  }

  describe("Required API Methods Implementation", () => {
    test("all required methods are implemented and callable", () => {
      const canvas = createTestCanvas();
      const ctx = far(canvas, { x: 0, y: 0, scale: 1 }).getContext("2d");

      // Check all required methods exist and are functions
      const requiredMethods = [
        "clearRect",
        "setTransform",
        "translate",
        "scale",
        "save",
        "drawImage",
        "restore",
        "beginPath",
        "moveTo",
        "lineTo",
        "stroke",
        "fillText",
        "setLineDash",
      ];

      const requiredProperties = [
        "filter",
        "strokeStyle",
        "lineWidth",
        "font",
        "fillStyle",
      ];

      requiredMethods.forEach((method) => {
        expect(typeof ctx[method]).toBe("function");
      });

      requiredProperties.forEach((prop) => {
        expect(ctx).toHaveProperty(prop);
      });
    });

    test("methods work without errors at far focus", () => {
      const canvas = createTestCanvas();
      const farAway = 500000000; // 500 million pixels
      const ctx = far(canvas, {
        x: farAway,
        y: farAway,
        scale: 2.1875,
      }).getContext("2d");

      expect(() => {
        // Test all required methods work without throwing
        ctx.save();
        ctx.translate(10, 20);
        ctx.scale(1.5, 1.5);
        ctx.rotate(Math.PI / 4);

        ctx.fillStyle = "red";
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;
        ctx.font = "16px Arial";
        ctx.filter = "blur(1px)";

        ctx.setLineDash([5, 5]);

        ctx.clearRect(farAway, farAway, 100, 100);

        ctx.beginPath();
        ctx.moveTo(farAway + 10, farAway + 10);
        ctx.lineTo(farAway + 50, farAway + 50);
        ctx.stroke();

        ctx.fillText("Test", farAway + 20, farAway + 30);

        // Create a small test image
        const imgCanvas = createCanvas(20, 20);
        const imgCtx = imgCanvas.getContext("2d");
        imgCtx.fillStyle = "green";
        imgCtx.fillRect(0, 0, 20, 20);

        ctx.drawImage(imgCanvas, farAway + 60, farAway + 60);

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.restore();
      }).not.toThrow();
    });
  });

  describe("Rotation Capability", () => {
    test("rotation methods work at far focus", () => {
      const canvas = createTestCanvas();
      const farAway = 100000000;
      const ctx = far(canvas, { x: farAway, y: farAway, scale: 1 }).getContext(
        "2d"
      );

      expect(() => {
        ctx.save();
        ctx.translate(farAway + 100, farAway + 100);
        ctx.rotate(Math.PI / 4); // 45 degrees
        ctx.fillStyle = "red";
        ctx.fillRect(farAway - 25, farAway - 10, 50, 20);
        ctx.restore();
      }).not.toThrow();
    });

    test("multiple rotation angles work", () => {
      const canvas = createTestCanvas();
      const farAway = 50000000;
      const ctx = far(canvas, { x: farAway, y: farAway, scale: 1 }).getContext(
        "2d"
      );

      const angles = [
        0,
        Math.PI / 6,
        Math.PI / 4,
        Math.PI / 2,
        Math.PI,
        -Math.PI / 4,
      ];

      angles.forEach((angle) => {
        expect(() => {
          ctx.save();
          ctx.translate(farAway + 50, farAway + 50);
          ctx.rotate(angle);
          ctx.fillStyle = "blue";
          ctx.fillRect(farAway, farAway, 20, 20);
          ctx.restore();
        }).not.toThrow();
      });
    });
  });

  describe("Flipping Capability", () => {
    test("horizontal flip works at far focus", () => {
      const canvas = createTestCanvas();
      const farAway = 75000000;
      const ctx = far(canvas, { x: farAway, y: farAway, scale: 1 }).getContext(
        "2d"
      );

      expect(() => {
        ctx.save();
        ctx.translate(farAway + 100, farAway + 50);
        ctx.scale(-1, 1); // Horizontal flip
        ctx.fillStyle = "blue";
        ctx.fillRect(farAway - 30, farAway, 60, 30);
        ctx.restore();
      }).not.toThrow();
    });

    test("vertical flip works at far focus", () => {
      const canvas = createTestCanvas();
      const farAway = 80000000;
      const ctx = far(canvas, { x: farAway, y: farAway, scale: 1 }).getContext(
        "2d"
      );

      expect(() => {
        ctx.save();
        ctx.translate(farAway + 50, farAway + 100);
        ctx.scale(1, -1); // Vertical flip
        ctx.fillStyle = "green";
        ctx.fillRect(farAway, farAway - 30, 60, 30);
        ctx.restore();
      }).not.toThrow();
    });

    test("both horizontal and vertical flip works", () => {
      const canvas = createTestCanvas();
      const farAway = 90000000;
      const ctx = far(canvas, { x: farAway, y: farAway, scale: 1 }).getContext(
        "2d"
      );

      expect(() => {
        ctx.save();
        ctx.translate(farAway + 50, farAway + 50);
        ctx.scale(-1, -1); // Both flips
        ctx.fillStyle = "purple";
        ctx.fillRect(farAway - 20, farAway - 20, 40, 40);
        ctx.restore();
      }).not.toThrow();
    });
  });

  describe("Image Resizing Capability", () => {
    test("image resizing works at far focus", () => {
      const canvas = createTestCanvas();
      const farAway = 200000000;
      const ctx = far(canvas, { x: farAway, y: farAway, scale: 1 }).getContext(
        "2d"
      );

      // Create source image
      const sourceCanvas = createCanvas(50, 50);
      const sourceCtx = sourceCanvas.getContext("2d");
      sourceCtx.fillStyle = "purple";
      sourceCtx.fillRect(0, 0, 50, 50);

      expect(() => {
        // Test 4-argument drawImage (resize)
        ctx.drawImage(sourceCanvas, farAway, farAway, 100, 80);
      }).not.toThrow();
    });

    test("image source rectangle and resizing works", () => {
      const canvas = createTestCanvas();
      const farAway = 300000000;
      const ctx = far(canvas, { x: farAway, y: farAway, scale: 1 }).getContext(
        "2d"
      );

      // Create source image with pattern
      const sourceCanvas = createCanvas(100, 100);
      const sourceCtx = sourceCanvas.getContext("2d");
      sourceCtx.fillStyle = "red";
      sourceCtx.fillRect(0, 0, 100, 100);
      sourceCtx.fillStyle = "blue";
      sourceCtx.fillRect(25, 25, 50, 50);

      expect(() => {
        // Test 8-argument drawImage (source rect + resize)
        ctx.drawImage(sourceCanvas, 25, 25, 50, 50, farAway, farAway, 80, 60);
      }).not.toThrow();
    });
  });

  describe("Vertical Text Capability", () => {
    test("vertical text rendering works at far focus", () => {
      const canvas = createTestCanvas();
      const farAway = 150000000;
      const ctx = far(canvas, { x: farAway, y: farAway, scale: 1 }).getContext(
        "2d"
      );

      expect(() => {
        ctx.save();
        ctx.translate(farAway + 100, farAway + 50);
        ctx.rotate(Math.PI / 2); // 90 degrees for vertical text
        ctx.fillStyle = "black";
        ctx.font = "20px Arial";
        ctx.fillText("Vertical Text", farAway, farAway);
        ctx.restore();
      }).not.toThrow();
    });

    test("text with different orientations works", () => {
      const canvas = createTestCanvas();
      const farAway = 80000000;
      const ctx = far(canvas, { x: farAway, y: farAway, scale: 1 }).getContext(
        "2d"
      );

      const angles = [0, Math.PI / 4, Math.PI / 2, Math.PI, -Math.PI / 4];

      angles.forEach((angle, index) => {
        expect(() => {
          ctx.save();
          ctx.translate(farAway + 150, farAway + 150);
          ctx.rotate(angle);
          ctx.fillStyle = "red";
          ctx.font = "16px Arial";
          ctx.fillText(`Text ${index}`, farAway - 30, farAway);
          ctx.restore();
        }).not.toThrow();
      });
    });
  });

  describe("Complex Transformations", () => {
    test("combined transformations work at far focus", () => {
      const canvas = createTestCanvas();
      const farAway = 400000000;
      const ctx = far(canvas, { x: farAway, y: farAway, scale: 1 }).getContext(
        "2d"
      );

      expect(() => {
        ctx.save();
        ctx.translate(farAway + 125, farAway + 125);
        ctx.rotate(Math.PI / 6); // 30 degrees
        ctx.scale(1.5, 0.8); // Non-uniform scaling
        ctx.translate(-20, -15);

        ctx.fillStyle = "orange";
        ctx.fillRect(farAway, farAway, 40, 30);

        ctx.strokeStyle = "purple";
        ctx.lineWidth = 3;
        ctx.strokeRect(farAway, farAway, 40, 30);

        ctx.restore();
      }).not.toThrow();
    });

    test("nested save/restore with transforms work", () => {
      const canvas = createTestCanvas();
      const farAway = 500000000;
      const ctx = far(canvas, { x: farAway, y: farAway, scale: 1 }).getContext(
        "2d"
      );

      expect(() => {
        ctx.save();
        ctx.translate(farAway + 50, farAway + 50);
        ctx.rotate(Math.PI / 4);

        ctx.save();
        ctx.scale(2, 2);
        ctx.fillStyle = "red";
        ctx.fillRect(farAway, farAway, 10, 10);
        ctx.restore();

        ctx.fillStyle = "blue";
        ctx.fillRect(farAway + 20, farAway, 10, 10);
        ctx.restore();

        ctx.fillStyle = "green";
        ctx.fillRect(farAway + 100, farAway + 100, 10, 10);
      }).not.toThrow();
    });
  });

  describe("Property Consistency", () => {
    test("properties work correctly at far focus", () => {
      const canvas = createTestCanvas();
      const farAway = 600000000;
      const ctx = far(canvas, { x: farAway, y: farAway, scale: 2 }).getContext(
        "2d"
      );

      // Test that properties can be set and retrieved
      ctx.fillStyle = "#FF0000";
      expect(ctx.fillStyle).toBe("#ff0000"); // Canvas normalizes to lowercase

      ctx.strokeStyle = "blue";
      expect(ctx.strokeStyle).toBe("#0000ff");

      ctx.lineWidth = 5;
      expect(ctx.lineWidth).toBe(5);

      ctx.font = "24px Arial";
      expect(ctx.font).toBe("24px Arial");

      ctx.filter = "blur(2px)";
      expect(ctx.filter).toBe("blur(2px)");
    });
  });
});
