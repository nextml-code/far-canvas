# far-canvas

## Motivation

For example: translated `100'000'000px` away from the center (and a scaling of 1.5) and rendering the objects that far away:

### vanilla canvas exapmle at 0px translation
<img
  src="static/reference-canvas.png"
  alt="vanilla canvas example"
  title="Vanilla Canvas Example"
  style="display: inline-block; margin: 0 auto;">

### vanilla canvas example at 100Mpx translation
<img
  src="static/vanilla-canvas.png"
  alt="vanilla canvas example"
  title="Vanilla Canvas Example"
  style="display: inline-block; margin: 0 auto;">

### far canvas example at 100Mpx translation
<img
  src="static/far-canvas.png"
  alt="far canvas example"
  title="Far Canvas Example"
  style="display: inline-block; margin: 0 auto;">

1. Images, rectangles and lines are all missaligned.
2. `lineWidth=8px` is not rendered correctly.

## install

```bash
npm install @nextml/far-canvas
```

## usage

```javascript
<FIXME>
```

## development
### run exampl
```bash
npm run example
```

### update version
```bash
npm version patch | minor | major
```
