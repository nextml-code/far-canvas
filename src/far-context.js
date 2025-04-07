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
    this._applyTransform();
  }

  /**
   * Apply the current transform to the context
   * @private
   */
  _applyTransform() {
    this.context.resetTransform();
    this.context.scale(this.transform.scale, this.transform.scale);
    this.context.translate(
      this.transform.translateX,
      this.transform.translateY
    );
  }

  /**
   * Transform a point from world to canvas coordinates
   * @private
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @returns {{x: number, y: number}} Canvas coordinates
   */
  _transformPoint(x, y) {
    // No need for point transformation since we're using native canvas transforms
    return { x, y };
  }

  // Context state methods
  save() {
    this.context.save();
    return this;
  }

  restore() {
    this.context.restore();
    return this;
  }

  // Transformation methods
  scale(x, y) {
    this.transform.setScale(this.transform.scale * x);
    this._applyTransform();
    return this;
  }

  translate(x, y) {
    const pos = this.transform.getPosition();
    this.transform.setPosition(pos.x + x, pos.y + y);
    this._applyTransform();
    return this;
  }

  // Drawing methods
  beginPath() {
    this.context.beginPath();
    return this;
  }

  closePath() {
    this.context.closePath();
    return this;
  }

  moveTo(x, y) {
    this.context.moveTo(x, y);
    return this;
  }

  lineTo(x, y) {
    this.context.lineTo(x, y);
    return this;
  }

  rect(x, y, width, height) {
    this.context.rect(x, y, width, height);
    return this;
  }

  fillRect(x, y, width, height) {
    this.context.fillRect(x, y, width, height);
    return this;
  }

  strokeRect(x, y, width, height) {
    this.context.strokeRect(x, y, width, height);
    return this;
  }

  clearRect(x, y, width, height) {
    this.context.clearRect(x, y, width, height);
    return this;
  }

  arc(x, y, radius, startAngle, endAngle, counterclockwise = false) {
    this.context.arc(x, y, radius, startAngle, endAngle, counterclockwise);
    return this;
  }

  // Image drawing
  drawImage(image, ...args) {
    this.context.drawImage(image, ...args);
    return this;
  }

  // Text methods
  fillText(text, x, y, maxWidth) {
    if (maxWidth !== undefined) {
      this.context.fillText(text, x, y, maxWidth);
    } else {
      this.context.fillText(text, x, y);
    }
    return this;
  }

  strokeText(text, x, y, maxWidth) {
    if (maxWidth !== undefined) {
      this.context.strokeText(text, x, y, maxWidth);
    } else {
      this.context.strokeText(text, x, y);
    }
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

  // Path methods
  stroke() {
    this.context.stroke();
    return this;
  }

  fill() {
    this.context.fill();
    return this;
  }
}

export { FarContext2D };
