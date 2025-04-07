import { Transform } from "./transform.js";
import { FarContext2D } from "./far-context.js";

/**
 * FarCanvas class that wraps a standard HTML Canvas element
 * to support drawing at large distances from origin
 */
class FarCanvas {
  /**
   * Create a new FarCanvas instance
   * @param {HTMLCanvasElement} canvas - The canvas element to wrap
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.transform = new Transform();
    this._context = null;
  }

  /**
   * Get the rendering context
   * @param {string} contextType - The context type (only '2d' supported currently)
   * @param {Object} [contextAttributes] - Context attributes
   * @returns {FarContext2D|null} The rendering context
   */
  getContext(contextType, contextAttributes) {
    if (contextType !== "2d") {
      console.warn("FarCanvas currently only supports 2d context");
      return null;
    }

    if (!this._context) {
      const originalContext = this.canvas.getContext("2d", contextAttributes);
      this._context = new FarContext2D(originalContext, this.transform);
    }

    return this._context;
  }

  /**
   * Set the canvas dimensions
   * @param {number} width - New width in pixels
   * @param {number} height - New height in pixels
   */
  setDimensions(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;

    // Context needs to be recreated when canvas is resized
    this._context = null;
  }

  /**
   * Get the canvas width
   * @returns {number} Canvas width in pixels
   */
  get width() {
    return this.canvas.width;
  }

  /**
   * Set the canvas width
   * @param {number} value - New width in pixels
   */
  set width(value) {
    this.canvas.width = value;
    this._context = null;
  }

  /**
   * Get the canvas height
   * @returns {number} Canvas height in pixels
   */
  get height() {
    return this.canvas.height;
  }

  /**
   * Set the canvas height
   * @param {number} value - New height in pixels
   */
  set height(value) {
    this.canvas.height = value;
    this._context = null;
  }

  /**
   * Get the underlying HTML Canvas element
   * @returns {HTMLCanvasElement} The canvas element
   */
  get element() {
    return this.canvas;
  }
}

export { FarCanvas };
