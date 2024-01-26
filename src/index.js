const isDefined = (o) => ![null, undefined].includes(o);

const getFarContext2d = (
  canvas,
  { x = 0, y = 0, scale = 1, rotation = { x: 0, y: 0, angle: 0 } } = {}
) => {
  if (![0, Math.PI].includes(rotation.angle)) {
    throw new Error("Only 0 and PI rotation angles are supported");
  }

  const _context = canvas.getContext("2d");

  const d = { x, y: y * Math.cos(rotation.angle), scale, rotation };

  const s = {
    x: (x) => {
      // First, translate, then rotate
      const translatedX = x + d.x;
      const translatedY = d.y; // y-coordinate remains the same for calculating x
      // Apply rotation
      const rotatedX =
        Math.cos(d.rotation.angle) * (translatedX - d.rotation.x) -
        Math.sin(d.rotation.angle) * (translatedY - d.rotation.y) +
        d.rotation.x;
      // Finally, apply scaling
      return d.scale * rotatedX;
    },
    y: (y) => {
      // First, translate, then rotate
      const translatedX = d.x; // x-coordinate remains the same for calculating y
      const translatedY = y + d.y;
      // Apply rotation
      const rotatedY =
        Math.sin(d.rotation.angle) * (translatedX - d.rotation.x) +
        Math.cos(d.rotation.angle) * (translatedY - d.rotation.y) +
        d.rotation.y;
      // Finally, apply scaling
      return d.scale * rotatedY;
    },
    distance: (distance) => distance * d.scale, // Scale distances
    inv: {
      x: (x) => {
        // First, undo scaling
        let unscaledX = x / d.scale;
        // Then, undo rotation
        const rotatedX =
          Math.cos(-d.rotation.angle) * (unscaledX - d.rotation.x) -
          Math.sin(-d.rotation.angle) * -d.rotation.y +
          d.rotation.x;
        // Finally, undo translation
        return rotatedX - d.x;
      },
      y: (y) => {
        // First, undo scaling
        let unscaledY = y / d.scale;
        // Then, undo rotation
        const rotatedY =
          Math.sin(-d.rotation.angle) * -d.rotation.x +
          Math.cos(-d.rotation.angle) * (unscaledY - d.rotation.y) +
          d.rotation.y;
        // Finally, undo translation
        return rotatedY - d.y;
      },
      distance: (distance) => distance / d.scale, // Undo scaling for distances
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
      const font_ = _context.font.split(" ").filter((a) => a.trim());

      if (![2, 3].includes(font_.length)) {
        notSupported("font(!'[<style> ]<size> <face>')");
      } else {
        const [style, size, face] = font_.length == 3 ? font_ : ["", ...font_];

        const sizeValue = parseFloat(size.match(/[0-9\.]/g).join(""));
        const sizeUnit = size.match(/[A-Za-z]/g).join("");

        return `${style} ${s.inv.distance(sizeValue)}${sizeUnit} ${face}`;
      }
    },
    set font(font) {
      const font_ = font.split(" ").filter((a) => a.trim());

      if (![2, 3].includes(font_.length)) {
        notSupported("font(!'[<style> ]<size> <face>')");
      } else {
        const [style, size, face] = font_.length == 3 ? font_ : ["", ...font_];

        const sizeValue = parseFloat(size.match(/[0-9\.]/g).join(""));
        const sizeUnit = size.match(/[A-Za-z]/g).join("");

        _context.font = `${style} ${s.distance(sizeValue)}${sizeUnit} ${face}`;
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

        // Save the current context state
        _context.save();

        // Move to where the image will be drawn and apply rotation
        _context.translate(s.x(dx), s.y(dy));
        _context.rotate(d.rotation.angle);

        // Draw the image with its top-left corner at the origin
        _context.drawImage(
          image,
          0,
          0,
          s.distance(image.width),
          s.distance(image.height)
        );

        // Restore the context to its original state
        _context.restore();
      } else if (args.length === 4) {
        const [dx, dy, dWidth, dHeight] = args;
        // Similar steps as above, adapted for specified width and height
        _context.save();
        _context.translate(s.x(dx), s.y(dy));
        _context.rotate(d.rotation.angle);
        _context.drawImage(
          image,
          0,
          0,
          s.distance(dWidth),
          s.distance(dHeight)
        );
        _context.restore();
      } else if (args.length === 8) {
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
        // TODO Path2D
        notImplementedYet("fill(Path2D, .)");
      } else {
        return _context.fill(...args);
      }
    },
    fillRect(x, y, width, height) {
      // Save the current context state
      _context.save();

      // Calculate the center of the rectangle
      let centerX = x + width / 2;
      let centerY = y + height / 2;

      // Move to the center of the rectangle
      _context.translate(s.x(centerX), s.y(centerY));

      // Rotate the context
      _context.rotate(d.rotation.angle);

      // Move back from the center to the top-left corner of the rectangle
      _context.translate(-s.distance(width) / 2, -s.distance(height) / 2);

      // Draw the rectangle
      _context.fillRect(0, 0, s.distance(width), s.distance(height));

      // Restore the context to its original state
      _context.restore();
    },
    fillText(text, x, y, maxWidth = undefined) {
      // Save the current context state
      _context.save();

      // Apply translation and rotation
      _context.translate(s.x(x), s.y(y));
      _context.rotate(d.rotation.angle);

      // Render the text
      _context.fillText(
        text,
        0,
        0,
        isDefined(maxWidth) ? s.distance(maxWidth) : undefined
      );

      // Restore the context to its original state
      _context.restore();
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
      // Save the current context state
      _context.save();

      // Calculate the center of the rectangle
      let centerX = x + width / 2;
      let centerY = y + height / 2;

      // Move to the center of the rectangle
      _context.translate(s.x(centerX), s.y(centerY));

      // Rotate the context
      _context.rotate(d.rotation.angle);

      // Move back from the center to the top-left corner of the rectangle
      _context.translate(-s.distance(width) / 2, -s.distance(height) / 2);

      // Create the rectangle path
      _context.beginPath();
      _context.rect(0, 0, s.distance(width), s.distance(height));
      _context.closePath();

      // Restore the context to its original state
      _context.restore();
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
      // Save the current context state
      _context.save();

      // Translate to the baseline starting point of the text
      _context.translate(s.x(x), s.y(y));

      // Rotate the context
      _context.rotate(d.rotation.angle);

      // Draw the text
      _context.strokeText(
        text,
        0,
        0,
        maxWidth !== undefined ? s.distance(maxWidth) : undefined
      );

      // Restore the context to its original state
      _context.restore();
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

export const far = (
  canvas,
  { x = 0, y = 0, scale = 1, rotation = { x: 0, y: 0, angle: 0 } } = {}
) => ({
  getContext: (contextType, contextAttribute) => {
    if (contextType == "2d" && !isDefined(contextAttribute)) {
      return getFarContext2d(canvas, { x, y, scale, rotation });
    } else {
      throw new Error('getContext(contextType != "2d") not implemented');
    }
  },
});
