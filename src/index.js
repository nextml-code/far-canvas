const getFarContext2d = function (canvas, d = {dx: 0, dy: 0, scale: 1}) {
    const s = {
        x: x => d.scale * (x + d.x),
        y: y => d.scale * (y + d.y),
        distance: distance => distance * d.scale,
        inv: {
            x: x => (x/d.scale - d.x),
            y: y => (y/d.scale - d.y),
            distance: distance => distance / d.scale,
        }
    };

    const _context = canvas.getContext("2d");

	return {
        translate(x, y) {
            throw new Error('transform not supported');
        },
        scale(x, y) {
            throw new Error('transform not supported');
        },
        transform(a, b, c, d, e, f) {
            throw new Error('transform not supported');
        },
        save() {
            return _context.save();
        },
        restore() {
            return _context.restore();
        },
        drawImage(image, ...args) {
            if (args.length === 2) {
                const [dx, dy] = args;
                return _context.drawImage(image, s.x(dx), s.y(dy));
            } else if (args.length === 4) {
                const [dx, dy, dWidth, dHeight] = args;
                return _context.drawImage(image, s.x(dx), s.y(dy), s.distance(dWidth), s.distance(dHeight));
            } else if (args.length === 8) {
                const [sx, sy, sWidth, sHeight, dx, dy] = args;
                throw new Error('drawImage(sx, sy, sWidth, sHeight, dx, dy) not implemented');
            }
        },
        fillRect(x, y, width, height) {
            return _context.fillRect(s.x(x), s.y(y), s.distance(width), s.distance(height));
        },
        beginPath() {
            return _context.beginPath();
        },
        moveTo(x, y) {
            return _context.moveTo(s.x(x), s.y(y));
        },
        lineTo(x, y) {
            return _context.lineTo(s.x(x), s.y(y));
        },
        stroke() {
            return _context.stroke();
        },
        get lineWidth() {
            return s.inv.distance(_context.lineWidth);
        },
        set lineWidth(width) {
            _context.lineWidth = s.distance(width);
        },
        get strokeStyle() {
            return _context.strokeStyle;
        },
        set strokeStyle(style) {
            _context.strokeStyle = style;
        },
        get fillStyle() {
            // NOTE only supports CSS <color> value
            return _context.fillStyle;
        },
        set fillStyle(style) {
            // NOTE only supports colour
            _context.fillStyle = style;
        },
        s,
    }
};
