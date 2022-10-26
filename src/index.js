const isDefined = (o) => ![null, undefined].includes(o);

const getFarContext2d = (canvas, { x = 0, y = 0, scale = 1 } = {}) => {
  const d = { x, y, scale };
  const _context = canvas.getContext("2d");

  const s = {
    x: (x) => d.scale * (x + d.x),
    y: (y) => d.scale * (y + d.y),
    distance: (distance) => distance * d.scale,
    inv: {
      x: (x) => x / d.scale - d.x,
      y: (y) => y / d.scale - d.y,
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
  // FIXME text default size

  const notSupported = (name) => {
    throw new Error(`${name} not supported`);
  };
  const notImplementedYet = (name) => {
    throw new Error(`${name} not implemented yet`);
  };

  /* FIXME
    - font
    - all text stuff
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
      // NOTE only supports CSS <color> value
      return _context.fillStyle;
    },
    set fillStyle(style) {
      // NOTE only supports colour
      _context.fillStyle = style;
    },
    get filter() {
      notImplementedYet("filter");
    },
    set filter(filter) {
      notImplementedYet("filter");
    },
    get font() {
      notImplementedYet("font");
    },
    set font(font) {
      notImplementedYet("font");
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
      return s.inv.distance(_context.lineDashOffset);
    },
    set lineDashOffset(lineDashOffset) {
      _context.lineDashOffset = s.distance(lineDashOffset);
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
      return s.inv.distance(_context.miterLimit);
    },
    set miterLimit(miterLimit) {
      _context.miterLimit = s.distance(miterLimit);
    },
    get shadowBlur() {
      // This value doesn't correspond to a number of pixels, and is not affected by the current transformation matrix
      // - https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/shadowBlur
      return _context.shadowBlur;
    },
    set shadowBlur(shadowBlur) {
      // This value doesn't correspond to a number of pixels, and is not affected by the current transformation matrix
      // - https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/shadowBlur
      _context.shadowBlur = shadowBlur;
    },
    get shadowColor() {
      return _context.shadowColor;
    },
    set shadowColor(shadowColor) {
      _context.shadowColor = shadowColor;
    },
    get shadowOffsetX() {
      return s.inv.distance(_context.shadowOffsetX);
    },
    set shadowOffsetX(shadowOffsetX) {
      _context.shadowOffsetX = s.distance(shadowOffsetX);
    },
    get shadowOffsetY() {
      return s.inv.distance(_context.shadowOffsetY);
    },
    set shadowOffsetY(shadowOffsetY) {
      _context.shadowOffsetY = s.distance(shadowOffsetY);
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
        endAngle
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
      // NOTE see clip
      if (args.length === 0) {
        return _context.clip();
      } else if (typeof args[0] === "object") {
        // FIXME Path2D
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
        notImplementedYet("createImageData(imagedata)");
      } else {
        const [width, height, settings] = args;
        return _context.createImageData(
          s.distance(width),
          s.distance(height),
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
        return _context.drawImage(image, s.x(dx), s.y(dy));
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
        const [sx, sy, sWidth, sHeight, dx, dy] = args;
        notImplementedYet("drawImage(sx, sy, sWidth, sHeight, dx, dy)");
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
      // NOTE see clip
      if (args.length === 0) {
        return _context.fill();
      } else if (typeof args[0] === "object") {
        // FIXME Path2D
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
    fillText(text, x, y, maxWidth) {
      return _context.fillText(text, s.x(x), s.y(y), s.distance(maxWidth));
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
    strokeText(text, x, y, maxWidth) {
      return _context.strokeText(text, s.x(x), s.y(y), s.distance(maxWidth));
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
