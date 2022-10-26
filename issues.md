## lineWidth is missrendered

```javascript
ctx.save();
ctx.strokeStyle = "pink";
ctx.lineWidth = 8;
if (ctx.canvasDimensions !== undefined) {
  console.log(ctx.canvasDimsensions);
  ctx.strokeRect(
    ctx.canvasDimensions.x,
    ctx.canvasDimensions.y,
    ctx.canvasDimensions.width,
    ctx.canvasDimensions.height
  );
} else {
  console.log(ctx.canvas.height, ctx.canvas.width);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.strokeRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
}
ctx.restore();
```
