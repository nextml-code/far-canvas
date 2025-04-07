/**
 * Constants for coordinate transformation
 */
const CHUNK_SIZE = 10000; // Size of coordinate chunks to prevent overflow

/**
 * Splits a large coordinate into major and minor components
 * @param {number} coordinate - The world coordinate to split
 * @returns {{major: number, minor: number}} Object containing major and minor components
 */
function splitCoordinate(coordinate) {
  const major = Math.floor(coordinate / CHUNK_SIZE) * CHUNK_SIZE;
  const minor = coordinate - major;
  return { major, minor };
}

/**
 * Combines major and minor components back into world coordinate
 * @param {number} major - Major component (chunk-aligned)
 * @param {number} minor - Minor component (within chunk)
 * @returns {number} Combined world coordinate
 */
function combineCoordinate(major, minor) {
  return major + minor;
}

/**
 * Transform class to manage coordinate transformations
 */
class Transform {
  constructor(x = 0, y = 0, scale = 1) {
    this.majorX = 0;
    this.majorY = 0;
    this.minorX = 0;
    this.minorY = 0;
    this.scale = scale;
    this.translateX = x;
    this.translateY = y;

    // Split the translation into major/minor components
    this.setPosition(x, y);
  }

  /**
   * Set the transform position
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   */
  setPosition(x, y) {
    this.translateX = x;
    this.translateY = y;
    const splitX = splitCoordinate(x);
    const splitY = splitCoordinate(y);

    this.majorX = splitX.major;
    this.majorY = splitY.major;
    this.minorX = splitX.minor;
    this.minorY = splitY.minor;
  }

  /**
   * Get the current world position
   * @returns {{x: number, y: number}} World coordinates
   */
  getPosition() {
    return {
      x: this.translateX,
      y: this.translateY,
    };
  }

  /**
   * Get the minor offsets for actual canvas translation
   * @returns {{x: number, y: number}} Canvas translation coordinates
   */
  getCanvasOffset() {
    return {
      x: this.minorX * this.scale,
      y: this.minorY * this.scale,
    };
  }

  /**
   * Transform a point from world coordinates to canvas coordinates
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @returns {{x: number, y: number}} Canvas coordinates
   */
  worldToCanvas(x, y) {
    // First apply translation, then scale
    return {
      x: (x + this.translateX - this.majorX) * this.scale,
      y: (y + this.translateY - this.majorY) * this.scale,
    };
  }

  /**
   * Transform a point from canvas coordinates to world coordinates
   * @param {number} x - Canvas X coordinate
   * @param {number} y - Canvas Y coordinate
   * @returns {{x: number, y: number}} World coordinates
   */
  canvasToWorld(x, y) {
    return {
      x: x / this.scale + this.majorX - this.translateX,
      y: y / this.scale + this.majorY - this.translateY,
    };
  }

  /**
   * Set the transform scale
   * @param {number} scale - New scale value
   */
  setScale(scale) {
    this.scale = scale;
  }
}

export { Transform, splitCoordinate, combineCoordinate, CHUNK_SIZE };
