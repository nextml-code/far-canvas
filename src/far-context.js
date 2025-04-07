/**
 * FarContext2D class that wraps CanvasRenderingContext2D
 * to support drawing at large distances from origin
 */
class FarContext2D {
  /**
   * Create a new FarContext2D instance
   * @param {CanvasRenderingContext2D} context - The original canvas context
   * @param {Transform} transform - The transform instance for coordinate conversion
   */
  constructor(context, transform) {
    this.context = context;
    this.transform = transform;
    this.transformStack = [];
    this.currentTransform = {
      translateX: 0,
      translateY: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      matrix: null,
      isScreenSpace: false,
    };
    this._applyTransform();
  }

  _applyTransform() {
    this.context.resetTransform();

    if (this.currentTransform.isScreenSpace) {
      // In screen space, only apply the current transform
      if (this.currentTransform.matrix) {
        const m = this.currentTransform.matrix;
        this.context.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
      } else {
        if (
          this.currentTransform.scaleX !== 1 ||
          this.currentTransform.scaleY !== 1
        ) {
          this.context.scale(
            this.currentTransform.scaleX,
            this.currentTransform.scaleY
          );
        }
        if (this.currentTransform.rotation !== 0) {
          this.context.rotate(this.currentTransform.rotation);
        }
        if (
          this.currentTransform.translateX !== 0 ||
          this.currentTransform.translateY !== 0
        ) {
          this.context.translate(
            this.currentTransform.translateX,
            this.currentTransform.translateY
          );
        }
      }
    } else {
      // In world space, match the reference canvas behavior
      // First apply scale
      this.context.scale(this.transform.scale, this.transform.scale);

      // Then apply translation (without chunking)
      this.context.translate(
        this.transform.translateX,
        this.transform.translateY
      );

      // Finally apply any additional transforms
      if (this.currentTransform.matrix) {
        const m = this.currentTransform.matrix;
        this.context.transform(m.a, m.b, m.c, m.d, m.e, m.f);
      } else {
        if (
          this.currentTransform.scaleX !== 1 ||
          this.currentTransform.scaleY !== 1
        ) {
          this.context.scale(
            this.currentTransform.scaleX,
            this.currentTransform.scaleY
          );
        }
        if (this.currentTransform.rotation !== 0) {
          this.context.rotate(this.currentTransform.rotation);
        }
        if (
          this.currentTransform.translateX !== 0 ||
          this.currentTransform.translateY !== 0
        ) {
          this.context.translate(
            this.currentTransform.translateX,
            this.currentTransform.translateY
          );
        }
      }
    }
  }

  /**
   * Transform a point from world to canvas coordinates
   * @private
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @returns {{x: number, y: number}} Canvas coordinates
   */
  _transformPoint(x, y) {
    if (this.currentTransform.isScreenSpace) {
      return { x, y };
    }
    // In world space, we don't need to transform coordinates
    // since we're using the canvas transform
    return { x, y };
  }

  _transformDimension(size) {
    if (this.currentTransform.isScreenSpace) {
      return size;
    }
    // In world space, we don't need to transform dimensions
    // since we're using the canvas transform
    return size;
  }

  // Context state methods
  save() {
    this.transformStack.push({ ...this.currentTransform });
    this.context.save();
    return this;
  }

  restore() {
    if (this.transformStack.length > 0) {
      this.currentTransform = this.transformStack.pop();
      this.context.restore();
      this._applyTransform();
    } else {
      // If stack is empty, reset to world space
      this.currentTransform = {
        translateX: 0,
        translateY: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        matrix: null,
        isScreenSpace: false,
      };
      this.context.restore();
      this._applyTransform();
    }
    return this;
  }

  // Drawing methods with coordinate transformation
  beginPath() {
    this.context.beginPath();
    return this;
  }

  closePath() {
    this.context.closePath();
    return this;
  }

  moveTo(x, y) {
    const point = this._transformPoint(x, y);
    this.context.moveTo(point.x, point.y);
    return this;
  }

  lineTo(x, y) {
    const point = this._transformPoint(x, y);
    this.context.lineTo(point.x, point.y);
    return this;
  }

  rect(x, y, width, height) {
    const point = this._transformPoint(x, y);
    const scaledWidth = this._transformDimension(width);
    const scaledHeight = this._transformDimension(height);
    this.context.rect(point.x, point.y, scaledWidth, scaledHeight);
    return this;
  }

  fillRect(x, y, width, height) {
    const point = this._transformPoint(x, y);
    const scaledWidth = this._transformDimension(width);
    const scaledHeight = this._transformDimension(height);
    this.context.fillRect(point.x, point.y, scaledWidth, scaledHeight);
    return this;
  }

  strokeRect(x, y, width, height) {
    const point = this._transformPoint(x, y);
    const scaledWidth = this._transformDimension(width);
    const scaledHeight = this._transformDimension(height);
    this.context.strokeRect(point.x, point.y, scaledWidth, scaledHeight);
    return this;
  }

  clearRect(x, y, width, height) {
    const point = this._transformPoint(x, y);
    const scaledWidth = this._transformDimension(width);
    const scaledHeight = this._transformDimension(height);
    this.context.clearRect(point.x, point.y, scaledWidth, scaledHeight);
    return this;
  }

  arc(x, y, radius, startAngle, endAngle, counterclockwise = false) {
    const point = this._transformPoint(x, y);
    const scaledRadius = this._transformDimension(radius);
    this.context.arc(
      point.x,
      point.y,
      scaledRadius,
      startAngle,
      endAngle,
      counterclockwise
    );
    return this;
  }

  // Image drawing with coordinate transformation
  drawImage(image, ...args) {
    if (args.length === 2) {
      // drawImage(image, dx, dy)
      const [dx, dy] = args;
      const point = this._transformPoint(dx, dy);
      this.context.drawImage(image, point.x, point.y);
    } else if (args.length === 4) {
      // drawImage(image, dx, dy, dw, dh)
      const [dx, dy, dw, dh] = args;
      const point = this._transformPoint(dx, dy);
      const scaledWidth = this._transformDimension(dw);
      const scaledHeight = this._transformDimension(dh);
      this.context.drawImage(
        image,
        point.x,
        point.y,
        scaledWidth,
        scaledHeight
      );
    } else if (args.length === 8) {
      // drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
      const [sx, sy, sw, sh, dx, dy, dw, dh] = args;
      const point = this._transformPoint(dx, dy);
      const scaledWidth = this._transformDimension(dw);
      const scaledHeight = this._transformDimension(dh);
      this.context.drawImage(
        image,
        sx,
        sy,
        sw,
        sh,
        point.x,
        point.y,
        scaledWidth,
        scaledHeight
      );
    }
    return this;
  }

  // Text methods with coordinate transformation
  fillText(text, x, y, maxWidth) {
    const point = this._transformPoint(x, y);
    if (maxWidth !== undefined) {
      const scaledMaxWidth = this._transformDimension(maxWidth);
      this.context.fillText(text, point.x, point.y, scaledMaxWidth);
    } else {
      this.context.fillText(text, point.x, point.y);
    }
    return this;
  }

  strokeText(text, x, y, maxWidth) {
    const point = this._transformPoint(x, y);
    if (maxWidth !== undefined) {
      const scaledMaxWidth = this._transformDimension(maxWidth);
      this.context.strokeText(text, point.x, point.y, scaledMaxWidth);
    } else {
      this.context.strokeText(text, point.x, point.y);
    }
    return this;
  }

  // Transform methods that work with our coordinate system
  scale(x, y = x) {
    if (this.currentTransform.isScreenSpace) {
      // In screen space, apply directly to context
      this.context.scale(x, y);
    } else {
      this.currentTransform.scaleX *= x;
      this.currentTransform.scaleY *= y;
      this._applyTransform();
    }
    return this;
  }

  translate(x, y) {
    if (this.currentTransform.isScreenSpace) {
      // In screen space, apply directly to context
      this.context.translate(x, y);
    } else {
      this.currentTransform.translateX += x;
      this.currentTransform.translateY += y;
      this._applyTransform();
    }
    return this;
  }

  rotate(angle) {
    if (this.currentTransform.isScreenSpace) {
      // In screen space, apply directly to context
      this.context.rotate(angle);
    } else {
      this.currentTransform.rotation += angle;
      this._applyTransform();
    }
    return this;
  }

  setTransform(a, b, c, d, e, f) {
    if (this.currentTransform.isScreenSpace) {
      // In screen space, apply directly to context
      this.context.setTransform(a, b, c, d, e, f);
    } else {
      this.currentTransform = {
        translateX: 0,
        translateY: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        matrix: new DOMMatrix([a, b, c, d, e, f]),
        isScreenSpace: false,
      };
      this._applyTransform();
    }
    return this;
  }

  transform(a, b, c, d, e, f) {
    if (this.currentTransform.isScreenSpace) {
      // In screen space, apply directly to context
      this.context.transform(a, b, c, d, e, f);
    } else {
      const currentMatrix = this.context.getTransform();
      const newMatrix = currentMatrix.multiply(
        new DOMMatrix([a, b, c, d, e, f])
      );
      this.currentTransform.matrix = newMatrix;
      this._applyTransform();
    }
    return this;
  }

  resetTransform() {
    this.currentTransform = {
      translateX: 0,
      translateY: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      matrix: null,
      isScreenSpace: true,
    };
    this.context.resetTransform();
    return this;
  }

  // Style properties (pass-through)
  get fillStyle() {
    return this.context.fillStyle;
  }
  set fillStyle(value) {
    this.context.fillStyle = value;
  }

  get strokeStyle() {
    return this.context.strokeStyle;
  }
  set strokeStyle(value) {
    this.context.strokeStyle = value;
  }

  get lineWidth() {
    return this.context.lineWidth;
  }
  set lineWidth(value) {
    this.context.lineWidth = value;
  }

  get font() {
    return this.context.font;
  }
  set font(value) {
    this.context.font = value;
  }

  get globalAlpha() {
    return this.context.globalAlpha;
  }
  set globalAlpha(value) {
    this.context.globalAlpha = value;
  }

  get globalCompositeOperation() {
    return this.context.globalCompositeOperation;
  }
  set globalCompositeOperation(value) {
    this.context.globalCompositeOperation = value;
  }

  // Path methods
  stroke() {
    this.context.stroke();
    return this;
  }

  fill() {
    this.context.fill();
    return this;
  }

  // Add after the transform methods
  /**
   * Gets the current transformation matrix
   * @returns {DOMMatrix} The current transformation matrix
   */
  getTransform() {
    return this.context.getTransform();
  }
}

export { FarContext2D };
