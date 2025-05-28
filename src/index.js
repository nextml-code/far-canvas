const isDefined = (o) => ![null, undefined].includes(o);

// Matrix multiplication: result = a * b
const multiplyMatrices = (a, b) => {
  return {
    a: a.a * b.a + a.c * b.b,
    b: a.b * b.a + a.d * b.b,
    c: a.a * b.c + a.c * b.d,
    d: a.b * b.c + a.d * b.d,
    e: a.a * b.e + a.c * b.f + a.e,
    f: a.b * b.e + a.d * b.f + a.f,
  };
};

// Create a transform matrix
const createMatrix = (a = 1, b = 0, c = 0, d = 1, e = 0, f = 0) => ({
  a,
  b,
  c,
  d,
  e,
  f,
});

// Create translation matrix
const translateMatrix = (x, y) => createMatrix(1, 0, 0, 1, x, y);

// Create scale matrix
const scaleMatrix = (x, y) => createMatrix(x, 0, 0, y, 0, 0);

// Create rotation matrix
const rotateMatrix = (angle) => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return createMatrix(cos, sin, -sin, cos, 0, 0);
};

// Invert a transform matrix
const invertMatrix = (m) => {
  const det = m.a * m.d - m.b * m.c;
  if (det === 0) {
    throw new Error("Matrix is not invertible");
  }
  return {
    a: m.d / det,
    b: -m.b / det,
    c: -m.c / det,
    d: m.a / det,
    e: (m.b * m.f - m.d * m.e) / det,
    f: (m.c * m.e - m.a * m.f) / det,
  };
};

// Apply matrix to a point
const transformPoint = (matrix, x, y) => ({
  x: matrix.a * x + matrix.c * y + matrix.e,
  y: matrix.b * x + matrix.d * y + matrix.f,
});

const getFarContext2d = (canvas, { x = 0, y = 0, scale = 1 } = {}) => {
  const _context = canvas.getContext("2d");

  // Check if the context supports transforms
  const supportsTransforms = typeof _context.setTransform === "function";

  if (supportsTransforms) {
    // Transform-Aware implementation
    return getTransformAwareContext(_context, canvas, { x, y, scale });
  } else {
    // Fallback to coordinate transformation implementation
    return getCoordinateTransformContext(_context, canvas, { x, y, scale });
  }
};

// Transform-Aware implementation (new approach)
const getTransformAwareContext = (_context, canvas, { x, y, scale }) => {
  // CRITICAL FIX: Don't pass large coordinates to setTransform!
  // Instead, use coordinate transformation for the far-canvas offset
  // and native transforms only for user transforms.

  // Far-canvas coordinate transformation (like the fallback implementation)
  const farTransform = {
    x: (worldX) => scale * (worldX - x),
    y: (worldY) => scale * (worldY - y),
    distance: (distance) => distance * scale,
    inv: {
      x: (screenX) => screenX / scale + x,
      y: (screenY) => screenY / scale + y,
      distance: (distance) => distance / scale,
    },
  };

  // Stack of transform states for save/restore
  const transformStack = [];

  // Current user transform (starts as identity)
  let userTransform = createMatrix();

  // Apply only the user transform to the canvas (no large translations!)
  const applyUserTransform = () => {
    const m = userTransform;
    _context.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
  };

  // Initialize with identity transform (no large coordinates passed to setTransform)
  applyUserTransform();

  // Canvas dimensions in user coordinates
  const getCanvasDimensions = () => {
    return {
      x: farTransform.inv.x(0),
      y: farTransform.inv.y(0),
      width: farTransform.inv.distance(canvas.width),
      height: farTransform.inv.distance(canvas.height),
    };
  };

  // Initialize line width and font with far-canvas scaling
  _context.lineWidth = farTransform.distance(1); // 1 world unit = scale screen pixels
  _context.font = `${farTransform.distance(10)}px sans-serif`; // 10 world units

  // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
  return {
    get canvas() {
      return _context.canvas;
    },
    set canvas(canvas) {
      _context.canvas = canvas;
    },
    get direction() {
      return _context.direction;
    },
    set direction(direction) {
      _context.direction = direction;
    },
    get fillStyle() {
      return _context.fillStyle;
    },
    set fillStyle(style) {
      _context.fillStyle = style;
    },
    get filter() {
      return _context.filter;
    },
    set filter(filter) {
      _context.filter = filter;
    },
    get font() {
      // Return the font in world coordinates
      const actualFont = _context.font;
      const fontParts = actualFont.split(" ").filter((a) => a.trim());

      if (![2, 3].includes(fontParts.length)) {
        return actualFont;
      }

      // Convert screen font size back to world coordinates
      const screenSize = parseFloat(fontParts[0]);
      const worldSize = farTransform.inv.distance(screenSize);
      return `${worldSize}px ${fontParts.slice(1).join(" ")}`;
    },
    set font(font) {
      const font_ = font.split(" ").filter((a) => a.trim());

      if (![2, 3].includes(font_.length)) {
        _context.font = font;
      } else {
        // Find the size part (ends with 'px')
        const sizeIndex = font_.findIndex((part) => part.endsWith("px"));
        if (sizeIndex === -1) {
          _context.font = font;
        } else {
          // Convert world font size to screen coordinates
          const worldSize = parseFloat(font_[sizeIndex]);
          const screenSize = farTransform.distance(worldSize);

          // Reconstruct font string with scaled size
          const fontParts = [...font_];
          fontParts[sizeIndex] = `${screenSize}px`;
          _context.font = fontParts.join(" ");
        }
      }
    },
    get fontKerning() {
      return _context.fontKerning;
    },
    set fontKerning(fontKerning) {
      _context.fontKerning = fontKerning;
    },
    get globalAlpha() {
      return _context.globalAlpha;
    },
    set globalAlpha(globalAlpha) {
      _context.globalAlpha = globalAlpha;
    },
    get globalCompositeOperation() {
      return _context.globalCompositeOperation;
    },
    set globalCompositeOperation(globalCompositeOperation) {
      _context.globalCompositeOperation = globalCompositeOperation;
    },
    get imageSmoothingEnabled() {
      return _context.imageSmoothingEnabled;
    },
    set imageSmoothingEnabled(imageSmoothingEnabled) {
      _context.imageSmoothingEnabled = imageSmoothingEnabled;
    },
    get imageSmoothingQuality() {
      return _context.imageSmoothingQuality;
    },
    set imageSmoothingQuality(imageSmoothingQuality) {
      _context.imageSmoothingQuality = imageSmoothingQuality;
    },
    get lineCap() {
      return _context.lineCap;
    },
    set lineCap(lineCap) {
      _context.lineCap = lineCap;
    },
    get lineDashOffset() {
      return farTransform.inv.distance(_context.lineDashOffset);
    },
    set lineDashOffset(lineDashOffset) {
      _context.lineDashOffset = farTransform.distance(lineDashOffset);
    },
    get lineJoin() {
      return _context.lineJoin;
    },
    set lineJoin(lineJoin) {
      _context.lineJoin = lineJoin;
    },
    get lineWidth() {
      return farTransform.inv.distance(_context.lineWidth);
    },
    set lineWidth(width) {
      _context.lineWidth = farTransform.distance(width);
    },
    get miterLimit() {
      return farTransform.inv.distance(_context.miterLimit);
    },
    set miterLimit(miterLimit) {
      _context.miterLimit = farTransform.distance(miterLimit);
    },
    get shadowBlur() {
      return farTransform.inv.distance(_context.shadowBlur);
    },
    set shadowBlur(shadowBlur) {
      _context.shadowBlur = farTransform.distance(shadowBlur);
    },
    get shadowColor() {
      return _context.shadowColor;
    },
    set shadowColor(shadowColor) {
      _context.shadowColor = shadowColor;
    },
    get shadowOffsetX() {
      return farTransform.inv.distance(_context.shadowOffsetX);
    },
    set shadowOffsetX(shadowOffsetX) {
      _context.shadowOffsetX = farTransform.distance(shadowOffsetX);
    },
    get shadowOffsetY() {
      return farTransform.inv.distance(_context.shadowOffsetY);
    },
    set shadowOffsetY(shadowOffsetY) {
      _context.shadowOffsetY = farTransform.distance(shadowOffsetY);
    },
    get strokeStyle() {
      return _context.strokeStyle;
    },
    set strokeStyle(style) {
      _context.strokeStyle = style;
    },
    get textAlign() {
      return _context.textAlign;
    },
    set textAlign(textAlign) {
      _context.textAlign = textAlign;
    },
    get textBaseline() {
      return _context.textBaseline;
    },
    set textBaseline(textBaseline) {
      _context.textBaseline = textBaseline;
    },
    // Drawing methods - transform coordinates before passing to canvas
    arc(worldX, worldY, radius, startAngle, endAngle, counterclockwise) {
      return _context.arc(
        farTransform.x(worldX),
        farTransform.y(worldY),
        farTransform.distance(radius),
        startAngle,
        endAngle,
        counterclockwise
      );
    },
    arcTo(x1, y1, x2, y2, radius) {
      return _context.arcTo(
        farTransform.x(x1),
        farTransform.y(y1),
        farTransform.x(x2),
        farTransform.y(y2),
        farTransform.distance(radius)
      );
    },
    beginPath() {
      return _context.beginPath();
    },
    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
      return _context.bezierCurveTo(
        farTransform.x(cp1x),
        farTransform.y(cp1y),
        farTransform.x(cp2x),
        farTransform.y(cp2y),
        farTransform.x(x),
        farTransform.y(y)
      );
    },
    clearCanvas() {
      _context.save();
      _context.setTransform(1, 0, 0, 1, 0, 0);
      _context.clearRect(0, 0, _context.canvas.width, _context.canvas.height);
      _context.restore();
    },
    clearRect(worldX, worldY, width, height) {
      return _context.clearRect(
        farTransform.x(worldX),
        farTransform.y(worldY),
        farTransform.distance(width),
        farTransform.distance(height)
      );
    },
    clip(...args) {
      if (args.length === 0) {
        return _context.clip();
      } else if (typeof args[0] === "object") {
        throw new Error("clip(Path2D, .) not implemented yet");
      } else {
        return _context.clip(...args);
      }
    },
    closePath() {
      return _context.closePath();
    },
    createConicGradient(startAngle, worldX, worldY) {
      return _context.createConicGradient(
        startAngle,
        farTransform.x(worldX),
        farTransform.y(worldY)
      );
    },
    createImageData(...args) {
      if (args.length === 1) {
        return _context.createImageData(args[0]);
      } else {
        const [width, height, settings] = args;
        return _context.createImageData(
          farTransform.distance(width),
          farTransform.distance(height),
          settings
        );
      }
    },
    createLinearGradient(x0, y0, x1, y1) {
      return _context.createLinearGradient(
        farTransform.x(x0),
        farTransform.y(y0),
        farTransform.x(x1),
        farTransform.y(y1)
      );
    },
    createPattern(image, repetition) {
      throw new Error("createPattern not implemented yet");
    },
    createRadialGradient(x0, y0, r0, x1, y1, r1) {
      return _context.createRadialGradient(
        farTransform.x(x0),
        farTransform.y(y0),
        farTransform.distance(r0),
        farTransform.x(x1),
        farTransform.y(y1),
        farTransform.distance(r1)
      );
    },
    drawFocusIfNeeded(...args) {
      throw new Error("drawFocusIfNeeded not implemented yet");
    },
    drawImage(image, ...args) {
      if (args.length === 2) {
        const [dx, dy] = args;
        return _context.drawImage(
          image,
          farTransform.x(dx),
          farTransform.y(dy)
        );
      } else if (args.length === 4) {
        const [dx, dy, dWidth, dHeight] = args;
        return _context.drawImage(
          image,
          farTransform.x(dx),
          farTransform.y(dy),
          farTransform.distance(dWidth),
          farTransform.distance(dHeight)
        );
      } else if (args.length === 8) {
        const [sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight] = args;
        return _context.drawImage(
          image,
          sx,
          sy,
          sWidth,
          sHeight, // Source coordinates are not transformed
          farTransform.x(dx),
          farTransform.y(dy),
          farTransform.distance(dWidth),
          farTransform.distance(dHeight)
        );
      }
    },
    ellipse(
      worldX,
      worldY,
      radiusX,
      radiusY,
      rotation,
      startAngle,
      endAngle,
      counterclockwise
    ) {
      return _context.ellipse(
        farTransform.x(worldX),
        farTransform.y(worldY),
        farTransform.distance(radiusX),
        farTransform.distance(radiusY),
        rotation,
        startAngle,
        endAngle,
        counterclockwise
      );
    },
    fill(...args) {
      if (args.length === 0) {
        return _context.fill();
      } else if (typeof args[0] === "object") {
        throw new Error("fill(Path2D, .) not implemented yet");
      } else {
        return _context.fill(...args);
      }
    },
    fillRect(worldX, worldY, width, height) {
      return _context.fillRect(
        farTransform.x(worldX),
        farTransform.y(worldY),
        farTransform.distance(width),
        farTransform.distance(height)
      );
    },
    fillText(text, worldX, worldY, maxWidth = undefined) {
      return _context.fillText(
        text,
        farTransform.x(worldX),
        farTransform.y(worldY),
        maxWidth !== undefined ? farTransform.distance(maxWidth) : undefined
      );
    },
    getContextAttributes() {
      return _context.getContextAttributes();
    },
    getImageData(sx, sy, sw, sh, settings) {
      throw new Error("getImageData not implemented yet");
    },
    getLineDash() {
      return _context.getLineDash().map(farTransform.inv.distance);
    },
    getTransform() {
      // Return a copy of the user transform
      const MatrixClass =
        typeof DOMMatrix !== "undefined"
          ? DOMMatrix
          : class {
              constructor(init) {
                if (Array.isArray(init) && init.length === 6) {
                  [this.a, this.b, this.c, this.d, this.e, this.f] = init;
                }
              }
            };

      return new MatrixClass([
        userTransform.a,
        userTransform.b,
        userTransform.c,
        userTransform.d,
        userTransform.e,
        userTransform.f,
      ]);
    },
    isPointInPath(...args) {
      throw new Error("isPointInPath not implemented yet");
    },
    isPointInStroke(...args) {
      throw new Error("isPointInStroke not implemented yet");
    },
    lineTo(worldX, worldY) {
      return _context.lineTo(farTransform.x(worldX), farTransform.y(worldY));
    },
    measureText(text) {
      throw new Error("measureText not implemented yet");
    },
    moveTo(worldX, worldY) {
      return _context.moveTo(farTransform.x(worldX), farTransform.y(worldY));
    },
    putImageData(...args) {
      throw new Error("putImageData not implemented yet");
    },
    quadraticCurveTo(cpx, cpy, worldX, worldY) {
      return _context.quadraticCurveTo(
        farTransform.x(cpx),
        farTransform.y(cpy),
        farTransform.x(worldX),
        farTransform.y(worldY)
      );
    },
    rect(worldX, worldY, width, height) {
      return _context.rect(
        farTransform.x(worldX),
        farTransform.y(worldY),
        farTransform.distance(width),
        farTransform.distance(height)
      );
    },
    resetTransform() {
      userTransform = createMatrix();
      applyUserTransform();
    },
    restore() {
      _context.restore();
      // Restore our transform state
      if (transformStack.length > 0) {
        const state = transformStack.pop();
        userTransform = state.userTransform;
        applyUserTransform();
      }
    },
    rotate(angle) {
      userTransform = multiplyMatrices(userTransform, rotateMatrix(angle));
      applyUserTransform();
    },
    roundRect(worldX, worldY, width, height, radii) {
      return _context.roundRect(
        farTransform.x(worldX),
        farTransform.y(worldY),
        farTransform.distance(width),
        farTransform.distance(height),
        farTransform.distance(radii)
      );
    },
    save() {
      _context.save();
      // Save our transform state
      transformStack.push({
        userTransform: { ...userTransform },
      });
    },
    scale(scaleX, scaleY) {
      userTransform = multiplyMatrices(
        userTransform,
        scaleMatrix(scaleX, scaleY)
      );
      applyUserTransform();
    },
    setLineDash(segments) {
      return _context.setLineDash(segments.map(farTransform.distance));
    },
    setTransform(...args) {
      if (args.length === 1) {
        // DOMMatrix variant
        const matrix = args[0];
        userTransform = createMatrix(
          matrix.a,
          matrix.b,
          matrix.c,
          matrix.d,
          matrix.e,
          matrix.f
        );
      } else {
        // 6 parameter variant
        const [a, b, c, d, e, f] = args;
        userTransform = createMatrix(a, b, c, d, e, f);
      }
      applyUserTransform();
    },
    stroke() {
      return _context.stroke();
    },
    strokeRect(worldX, worldY, width, height) {
      return _context.strokeRect(
        farTransform.x(worldX),
        farTransform.y(worldY),
        farTransform.distance(width),
        farTransform.distance(height)
      );
    },
    strokeText(text, worldX, worldY, maxWidth = undefined) {
      return _context.strokeText(
        text,
        farTransform.x(worldX),
        farTransform.y(worldY),
        maxWidth !== undefined ? farTransform.distance(maxWidth) : undefined
      );
    },
    transform(a, b, c, d, e, f) {
      const newTransform = createMatrix(a, b, c, d, e, f);
      userTransform = multiplyMatrices(userTransform, newTransform);
      applyUserTransform();
    },
    translate(deltaX, deltaY) {
      userTransform = multiplyMatrices(
        userTransform,
        translateMatrix(deltaX, deltaY)
      );
      applyUserTransform();
    },
    // Legacy compatibility
    s: farTransform,
    get canvasDimensions() {
      return getCanvasDimensions();
    },
  };
};

// Coordinate transformation implementation (fallback for environments without transform support)
const getCoordinateTransformContext = (_context, canvas, { x, y, scale }) => {
  const d = { x, y, scale };

  const s = {
    x: (x) => d.scale * (x - d.x),
    y: (y) => d.scale * (y - d.y),
    distance: (distance) => distance * d.scale,
    inv: {
      x: (x) => x / d.scale + d.x,
      y: (y) => y / d.scale + d.y,
      distance: (distance) => distance / d.scale,
    },
  };

  const canvasDimensions = {
    x: s.inv.x(0),
    y: s.inv.y(0),
    width: s.inv.distance(canvas.width),
    height: s.inv.distance(canvas.height),
  };

  _context.lineWidth = s.distance(_context.lineWidth);
  _context.font = `${s.distance(10)}px sans-serif`;

  const notSupported = (name) => {
    throw new Error(`${name} not supported`);
  };
  const notImplementedYet = (name) => {
    throw new Error(`${name} not implemented yet`);
  };

  /* TODO
    - measureText
    - Path2d, farContext.Path2D ?
    */

  // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
  return {
    get canvas() {
      return _context.canvas;
    },
    set canvas(canvas) {
      _context.canvas = canvas;
    },
    get direction() {
      return _context.direction;
    },
    set direction(direction) {
      _context.direction = direction;
    },
    get fillStyle() {
      return _context.fillStyle;
    },
    set fillStyle(style) {
      _context.fillStyle = style;
    },
    get filter() {
      return _context.filter;
    },
    set filter(filter) {
      _context.filter = filter;
    },
    get font() {
      // Get the font string from the underlying context (which should be unscaled if our setter is correct)
      const actualFont = _context.font;
      const fontParts = actualFont.split(" ").filter((a) => a.trim());

      if (![2, 3].includes(fontParts.length)) {
        return actualFont; // Return as-is if we can't parse
      }
      // We don't need to inversely scale here if the setter stores the unscaled value.
      // The user expects to get back what they set, in their coordinate space.
      return actualFont.trim();
    },
    set font(font) {
      const font_ = font.split(" ").filter((a) => a.trim());

      if (![2, 3].includes(font_.length)) {
        _context.font = font;
      } else {
        // Find the size part (ends with 'px')
        const sizeIndex = font_.findIndex((part) => part.endsWith("px"));
        if (sizeIndex === -1) {
          _context.font = font;
        } else {
          // Convert world font size to screen coordinates
          const worldSize = parseFloat(font_[sizeIndex]);
          const screenSize = s.distance(worldSize);

          // Reconstruct font string with scaled size
          const fontParts = [...font_];
          fontParts[sizeIndex] = `${screenSize}px`;
          _context.font = fontParts.join(" ");
        }
      }
    },
    get fontKerning() {
      return _context.fontKerning;
    },
    set fontKerning(fontKerning) {
      _context.fontKerning = fontKerning;
    },
    get globalAlpha() {
      return _context.globalAlpha;
    },
    set globalAlpha(globalAlpha) {
      _context.globalAlpha = globalAlpha;
    },
    get globalCompositeOperation() {
      return _context.globalCompositeOperation;
    },
    set globalCompositeOperation(globalCompositeOperation) {
      _context.globalCompositeOperation = globalCompositeOperation;
    },
    get imageSmoothingEnabled() {
      return _context.imageSmoothingEnabled;
    },
    set imageSmoothingEnabled(imageSmoothingEnabled) {
      _context.imageSmoothingEnabled = imageSmoothingEnabled;
    },
    get imageSmoothingQuality() {
      return _context.imageSmoothingQuality;
    },
    set imageSmoothingQuality(imageSmoothingQuality) {
      _context.imageSmoothingQuality = imageSmoothingQuality;
    },
    get lineCap() {
      return _context.lineCap;
    },
    set lineCap(lineCap) {
      _context.lineCap = lineCap;
    },
    get lineDashOffset() {
      return _context.lineDashOffset;
    },
    set lineDashOffset(lineDashOffset) {
      _context.lineDashOffset = lineDashOffset;
    },
    get lineJoin() {
      return _context.lineJoin;
    },
    set lineJoin(lineJoin) {
      _context.lineJoin = lineJoin;
    },
    get lineWidth() {
      return s.inv.distance(_context.lineWidth);
    },
    set lineWidth(width) {
      _context.lineWidth = s.distance(width);
    },
    get miterLimit() {
      return _context.miterLimit / scale;
    },
    set miterLimit(miterLimit) {
      _context.miterLimit = miterLimit;
    },
    get shadowBlur() {
      return _context.shadowBlur;
    },
    set shadowBlur(shadowBlur) {
      _context.shadowBlur = shadowBlur;
    },
    get shadowColor() {
      return _context.shadowColor;
    },
    set shadowColor(shadowColor) {
      _context.shadowColor = shadowColor;
    },
    get shadowOffsetX() {
      return _context.shadowOffsetX;
    },
    set shadowOffsetX(shadowOffsetX) {
      _context.shadowOffsetX = shadowOffsetX;
    },
    get shadowOffsetY() {
      return _context.shadowOffsetY;
    },
    set shadowOffsetY(shadowOffsetY) {
      _context.shadowOffsetY = shadowOffsetY;
    },
    get strokeStyle() {
      return _context.strokeStyle;
    },
    set strokeStyle(style) {
      _context.strokeStyle = style;
    },
    get textAlign() {
      return _context.textAlign;
    },
    set textAlign(textAlign) {
      _context.textAlign = textAlign;
    },
    get textBaseline() {
      return _context.textBaseline;
    },
    set textBaseline(textBaseline) {
      _context.textBaseline = textBaseline;
    },
    arc(x, y, radius, startAngle, endAngle, counterclockwise) {
      return _context.arc(
        s.x(x),
        s.y(y),
        s.distance(radius),
        startAngle,
        endAngle,
        counterclockwise
      );
    },
    arcTo(x1, y1, x2, y2, radius) {
      return _context.arcTo(
        s.x(x1),
        s.y(y1),
        s.x(x2),
        s.y(y2),
        s.distance(radius)
      );
    },
    beginPath() {
      return _context.beginPath();
    },
    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
      return _context.bezierCurveTo(
        s.x(cp1x),
        s.y(cp1y),
        s.x(cp2x),
        s.y(cp2y),
        s.x(x),
        s.y(y)
      );
    },
    clearCanvas() {
      _context.save();
      _context.setTransform(1, 0, 0, 1, 0, 0);
      _context.clearRect(0, 0, _context.canvas.width, _context.canvas.height);
      _context.restore();
    },
    clearRect(x, y, width, height) {
      return _context.clearRect(
        s.x(x),
        s.y(y),
        s.distance(width),
        s.distance(height)
      );
    },
    clip(...args) {
      if (args.length === 0) {
        return _context.clip();
      } else if (typeof args[0] === "object") {
        // TODO Path2D
        notImplementedYet("clip(Path2D, .)");
      } else {
        return _context.clip(...args);
      }
    },
    closePath() {
      return _context.closePath();
    },
    createConicGradient(startAngle, x, y) {
      return _context.createConicGradient(startAngle, s.x(x), s.y(y));
    },
    createImageData(...args) {
      if (args.length === 1) {
        // ImageData. This object is not scaled by canvas transforms directly.
        // If the user passes an ImageData object, it implies screen pixels.
        // Or does it? If it's from another far-canvas, it might represent world data.
        // For now, to maintain consistency that far-canvas *methods* operate in world coords,
        // this variant is problematic if we assume the arg is screen-space ImageData.
        // Current fallback throws; transform-aware should perhaps also throw or clarify intent.
        // Let's assume for now that if they pass ImageData, it IS screen data, so pass through.
        // This is a tricky edge case that needs more thought for API consistency.
        // For now, pass through like other drawing ops, assuming it's handled by user.
        return _context.createImageData(args[0]);
      } else {
        const [width, height, settings] = args;
        // User provides width/height in world coordinates.
        // _context.createImageData expects screen pixels for new ImageData.
        return _context.createImageData(
          width * scale,
          height * scale,
          settings
        );
      }
    },
    createLinearGradient(x0, y0, x1, y1) {
      return _context.createLinearGradient(s.x(x0), s.y(y0), s.x(x1), s.y(y1));
    },
    createPattern(image, repetition) {
      notImplementedYet("createPattern");
    },
    createRadialGradient(x0, y0, r0, x1, y1, r1) {
      return _context.createRadialGradient(
        s.x(x0),
        s.y(y0),
        s.distance(r0),
        s.x(x1),
        s.y(y1),
        s.distance(r1)
      );
    },
    drawFocusIfNeeded(...args) {
      notImplementedYet("drawFocusIfNeeded");
    },
    drawImage(image, ...args) {
      if (args.length === 2) {
        const [dx, dy] = args;
        return _context.drawImage(
          image,
          s.x(dx),
          s.y(dy),
          s.distance(image.width),
          s.distance(image.height)
        );
      } else if (args.length === 4) {
        const [dx, dy, dWidth, dHeight] = args;
        return _context.drawImage(
          image,
          s.x(dx),
          s.y(dy),
          s.distance(dWidth),
          s.distance(dHeight)
        );
      } else if (args.length === 8) {
        // NOTE see getImageData
        const [sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight] = args;
        return _context.drawImage(
          image,
          sx,
          sy,
          sWidth,
          sHeight,
          s.x(dx),
          s.y(dy),
          s.distance(dWidth),
          s.distance(dHeight)
        );
      }
    },
    ellipse(
      x,
      y,
      radiusX,
      radiusY,
      rotation,
      startAngle,
      endAngle,
      counterclockwise
    ) {
      return _context.ellipse(
        s.x(x),
        s.y(y),
        s.distance(radiusX),
        s.distance(radiusY),
        rotation,
        startAngle,
        endAngle,
        counterclockwise
      );
    },
    fill(...args) {
      if (args.length === 0) {
        return _context.fill();
      } else if (typeof args[0] === "object") {
        // TODO Path2D
        notImplementedYet("fill(Path2D, .)");
      } else {
        return _context.fill(...args);
      }
    },
    fillRect(x, y, width, height) {
      return _context.fillRect(
        s.x(x),
        s.y(y),
        s.distance(width),
        s.distance(height)
      );
    },
    fillText(text, x, y, maxWidth = undefined) {
      return _context.fillText(
        text,
        s.x(x),
        s.y(y),
        isDefined(maxWidth) ? s.distance(maxWidth) : undefined
      );
    },
    getContextAttributes() {
      return _context.getContextAttributes();
    },
    getImageData(sx, sy, sw, sh, settings) {
      // NOTE see drawImage
      notImplementedYet("getImageData");
    },
    getLineDash() {
      return _context.getLineDash().map(s.inv.distance);
    },
    getTransform() {
      notSupported("getTransform");
    },
    isPointInPath(...args) {
      // requires Path2D
      notImplementedYet("isPointInPath");
    },
    isPointInStroke(...args) {
      // requires Path2d
      notImplementedYet("isPointInStroke");
    },
    lineTo(x, y) {
      return _context.lineTo(s.x(x), s.y(y));
    },
    measureText(text) {
      // requires TextMetrics wrap
      notImplementedYet("measureText");
    },
    moveTo(x, y) {
      return _context.moveTo(s.x(x), s.y(y));
    },
    putImageData(...args) {
      // NOTE see getImageData
      notImplementedYet("putImageData");
    },
    quadraticCurveTo(cpx, cpy, x, y) {
      return _context.quadraticCurveTo(s.x(cpx), s.y(cpy), s.x(x), s.y(y));
    },
    rect(x, y, width, height) {
      return _context.rect(
        s.x(x),
        s.y(y),
        s.distance(width),
        s.distance(height)
      );
    },
    resetTransform() {
      notSupported("resetTransform");
    },
    restore() {
      return _context.restore();
    },
    rotate(angle) {
      notSupported("rotate");
    },
    roundRect(x, y, width, height, radii) {
      return _context.roundRect(
        s.x(x),
        s.y(y),
        s.distance(width),
        s.distance(height),
        s.distance(radii)
      );
    },
    save() {
      return _context.save();
    },
    scale(x, y) {
      notSupported("scale");
    },
    setLineDash(segments) {
      return _context.setLineDash(segments.map(s.distance));
    },
    setTransform() {
      notSupported("setTransform");
    },
    stroke() {
      return _context.stroke();
    },
    strokeRect(x, y, width, height) {
      return _context.strokeRect(
        s.x(x),
        s.y(y),
        s.distance(width),
        s.distance(height)
      );
    },
    strokeText(text, x, y, maxWidth = undefined) {
      return _context.strokeText(
        text,
        s.x(x),
        s.y(y),
        isDefined(maxWidth) ? s.distance(maxWidth) : undefined
      );
    },
    transform(a, b, c, d, e, f) {
      notSupported("transform");
    },
    translate(x, y) {
      notSupported("translate");
    },
    s,
    canvasDimensions,
  };
};

export const far = (canvas, { x = 0, y = 0, scale = 1 } = {}) => ({
  getContext: (contextType, contextAttribute) => {
    if (contextType == "2d" && !isDefined(contextAttribute)) {
      return getFarContext2d(canvas, { x, y, scale });
    } else {
      throw new Error('getContext(contextType != "2d") not implemented');
    }
  },
});
