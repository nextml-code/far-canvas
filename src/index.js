import { FarCanvas } from "./far-canvas.js";
import { Transform } from "./transform.js";

/**
 * Create a new FarCanvas instance wrapping the given canvas element
 * @param {HTMLCanvasElement} element - The canvas element to wrap
 * @param {Object} [transform] - Initial transform parameters
 * @returns {FarCanvas} A new FarCanvas instance
 */
function far(element, transform) {
  const canvas = new FarCanvas(element);

  if (transform) {
    const { x = 0, y = 0, scale = 1 } = transform;
    canvas.transform.setPosition(x, y);
    canvas.transform.setScale(scale);
  }

  return canvas;
}

export { far, FarCanvas, Transform };
