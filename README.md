# zhtml

**Three.js HTML renderer** — render HTML elements in 3D by mapping DOM elements to WebGL geometry via CSS transforms. Unlike CSS3DRenderer, zhtml integrates HTML into the WebGL depth buffer so HTML can be occluded by 3D geometry, receive scene lighting and shadows, and participate in proper depth ordering.

## Features

- **Depth integration** — HTML is rendered as geometry in the WebGL scene; 3D objects can occlude HTML and vice versa
- **Scene lighting** — HTML surfaces can receive shadows and participate in Phong lighting via `ZHTMLMaterialPhong`
- **Multiple camera types** — Perspective, orthographic, and stereo (VR) cameras with built-in HTML alignment
- **Hit testing** — Pixel-based and object-based raycasting to detect when the cursor is over HTML vs 3D geometry (optional, for advanced use)
- **Interaction management** — Camera div and GL container use pointer-events so orbit controls and HTML inputs work correctly; optional programmatic control via hit testing
- **Automatic culling** — HTML elements are shown only when their 3D object is rendered (in view); off-screen or occluded objects have their elements hidden
- **Flexible geometry** — Create your own plane (or other geometry) for HTML objects; use embed or overlay material as needed

## Installation

```bash
npm install zhtml three
```

### Peer Dependencies

- **three** (^0.159.0) — required

## Quick Start

```ts
import * as THREE from 'three';
import {
  ZHTMLRenderer,
  ZHTMLRenderTarget,
  ZHTMLWebGLRenderAdapter,
  ZHTMLPerspectiveCamera,
  ZHTMLObject3D,
  ZHTMLInternalMaterialEmbed,
  ZHTMLMaterialPhong,
} from 'zhtml';

// 1. Create Three.js scene. Define canvas in your DOM, then create WebGL renderer with it
const scene = new THREE.Scene();
const canvas = document.getElementById('canvas')!;
const glRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas });
glRenderer.shadowMap.enabled = true;

// 2. Create zhtml renderer and render target
const renderAdapter = new ZHTMLWebGLRenderAdapter(glRenderer);

// 3. Create camera and add to scene
const camera = new ZHTMLPerspectiveCamera(50, 1, 0.1, 1000);
camera.position.set(0, 0, 500);
scene.add(camera);

// 4. Create HTML object with geometry
const htmlObject = new ZHTMLObject3D({});
const geometryNode = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new ZHTMLInternalMaterialEmbed());
geometryNode.scale.set(400, 300, 1);
htmlObject.htmlGeometryNode = geometryNode;

const effectMaterial = new ZHTMLMaterialPhong();
const effectNode = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  effectMaterial
);
effectNode.scale.set(400, 300, 1);
effectNode.position.z = 1;
htmlObject.add(effectNode);
scene.add(htmlObject);

// 5. Create render target and renderer (you own the DOM; pass element refs)
const sceneElement = document.getElementById('scene')!;
const cameraElement = document.getElementById('camera')!;

const renderTarget = new ZHTMLRenderTarget({ sceneElement, cameraElement });
renderTarget.registerElementForObject(htmlObject, document.getElementById('html-content')!);

const htmlRenderer = new ZHTMLRenderer({ renderAdapter, canvas });

// 6. Animation loop
function animate() {
  requestAnimationFrame(animate);
  htmlObject.htmlNeedsLayout = true;
  htmlRenderer.render({ scene, camera, renderTarget });
}
animate();
```

## Explicit Elements

You own the DOM structure entirely. zhtml never creates, appends, or removes nodes. You create the elements, pass references to zhtml, and control the WebGL canvas yourself.

### Setup

1. **ZHTMLRenderTarget** — Pass `sceneElement` and `cameraElement` (the divs that define the viewport bounds and hold your HTML content).
2. **registerElementForObject** — Link each `ZHTMLObject3D` to its HTML div via `renderTarget.registerElementForObject(object, element)`.
3. **ZHTMLRenderer** — Pass `canvas` for bounds observation. zhtml observes this element for resize; it never appends to it.
4. **Canvas in template** — Define the canvas in your template and pass it to `new THREE.WebGLRenderer({ canvas })`. Pass the same canvas to ZHTMLRenderer as `canvas`.

### Structure (Embed)

```html
<div id="scene-container" style="position: relative; width: 100%; height: 100%;">
  <!-- Scene: bounds for this viewport -->
  <div id="scene" style="position: absolute; width: 100%; height: 100%;">
    <!-- Camera: holds HTML, receives CSS transform -->
    <div id="camera" style="position: absolute; width: 100%; height: 100%; pointer-events: none;">
      <div id="html-content" style="position: absolute; width: 400px; height: 300px;">
        Your HTML content
      </div>
    </div>
  </div>
  <!-- Canvas: defined in template, passed to WebGLRenderer -->
  <canvas id="canvas" style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none;"></canvas>
</div>
```

```ts
const canvas = document.getElementById('canvas')!;
const glRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas });
const renderAdapter = new ZHTMLWebGLRenderAdapter(glRenderer);

const renderTarget = new ZHTMLRenderTarget({
  sceneElement: document.getElementById('scene')!,
  cameraElement: document.getElementById('camera')!,
});
renderTarget.registerElementForObject(htmlObject, document.getElementById('html-content')!);

const htmlRenderer = new ZHTMLRenderer({
  renderAdapter,
  canvas,
});
```

### Embed vs Overlay

- **Embed** — Scene div first, then canvas container. Use embed material so WebGL cuts a hole revealing HTML below.
- **Overlay** — Canvas container first, then scene div. Use overlay material so HTML appears on top.

### Stereo (Two Cameras)

Create two render targets with separate scene/camera elements (e.g. left and right halves). Duplicate your HTML content in each camera div. Register each copy with its respective render target.

### Interactive HTML Objects

To make an HTML 3D object interactive (inputs, buttons, scroll, etc.), enable pointer-events and user-select on its content div using CSS (e.g. `pointer-events: auto; user-select: auto` on the inner div that holds the actual content).

The GL container has `pointer-events: none`, so it does not capture mouse events. Orbit controls (or similar) attach to the DOM and receive events when the cursor is over empty space. When the cursor is over an interactive HTML element, that element captures the event and orbit controls do not receive it. No raycasting is needed for basic interaction switching.

### Visibility and Culling

zhtml automatically shows or hides HTML elements based on whether their 3D object is rendered this frame. If the object is in view (not culled by the camera frustum, not occluded), its element gets `display: block` and the correct CSS transform. If the object is off-screen or occluded, its element gets `display: none`. This avoids rendering HTML for objects the user cannot see.

**Initial state:** Before the first render, HTML elements would otherwise appear at their default position. Start elements hidden (e.g. `className="hidden"` or `display: none`) to prevent a flash of unstyled content. zhtml does not remove the class; it overrides visibility with inline `element.style.display`, so the class becomes irrelevant once the render loop starts.

## Cameras

### ZHTMLPerspectiveCamera

Standard perspective projection. Use for typical 3D views.

```ts
const camera = new ZHTMLPerspectiveCamera(fov, aspect, near, far);
camera.position.set(0, 0, 1000);
scene.add(camera);
```

### ZHTMLOrthographicCamera

Orthographic projection. Use for isometric or 2.5D views.

```ts
const camera = new ZHTMLOrthographicCamera(left, right, top, bottom, near, far);
camera.position.set(500, 500, 500);
camera.lookAt(0, 0, 0);
scene.add(camera);
```

The orthographic camera's `willRender` sets its frustum from the render target bounds, so you typically construct it with placeholder values and let the renderer update it.

### ZHTMLStereoCamera

Stereo (VR) camera with left and right eyes. Use for split-screen stereo or VR.

```ts
const stereoCamera = new ZHTMLStereoCamera(fov, aspect, near, far);
stereoCamera.position.set(0, 0, 800);
scene.add(stereoCamera);

// Render to two targets
htmlRenderer.render({ scene, camera: stereoCamera.cameraLeft, renderTarget: leftTarget });
htmlRenderer.render({ scene, camera: stereoCamera.cameraRight, renderTarget: rightTarget });
```

## ZHTMLObject3D

Extends `THREE.Object3D`. Links 3D geometry to DOM elements.

- **`htmlGeometryNode`** — A `THREE.Mesh` whose material renders the HTML (usually `ZHTMLInternalMaterialEmbed` or `ZHTMLInternalMaterialOverlay`). The mesh defines the screen-space region where HTML appears.
- **`htmlNeedsLayout`** — Set to `true` when the object's transform changes; the renderer will update the HTML element's CSS transform.
- **`htmlUpdateLayout()`** — Call to recompute the transform style from the object's world matrix.

## Geometry for HTML Objects

Geometry is not fundamentally required for overlays. For embeds, you create a mesh whose material "cuts out" the WebGL render to reveal the HTML below. Typically you create a plane, apply `ZHTMLInternalMaterialEmbed` (for embed) or `ZHTMLInternalMaterialOverlay` (for overlay), and assign it to `htmlObject.htmlGeometryNode`. The mesh defines the screen-space region where HTML appears.

```ts
const geometryNode = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new ZHTMLInternalMaterialEmbed()
);
geometryNode.scale.set(400, 300, 1);
htmlObject.htmlGeometryNode = geometryNode;
```

For dynamic sizing, you can set the plane's scale to match your HTML element's `offsetWidth` and `offsetHeight`, and use a `ResizeObserver` to update the scale when the element resizes. This lets your CSS control the physical size of the HTML object in 3D.

## Materials

### ZHTMLInternalMaterialEmbed

Used internally for embed render targets. Cuts a transparent hole in the scene so HTML shows through; participates in depth buffer.

### ZHTMLInternalMaterialOverlay

Used internally for overlay render targets. Renders transparent, no depth write, always on top.

### ZHTMLMaterialPhong

Phong material for HTML surfaces. Receives scene lighting and shadows. Use for screens, signs, etc.

```ts
const material = new ZHTMLMaterialPhong();
material.shininess = 30;
material.roughness = 0.5;
const effectNode = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
effectNode.scale.set(width, height, 1);
effectNode.position.z = 1;
htmlObject.add(effectNode);
```

### Custom Materials

Extend `ZHTMLShaderMaterial` and use the `#define HTML_PHONG` or `#include <beginHtml>` chunk. The material must support `htmlPixelTestEnabled` and `htmlPixelTestColor` uniforms for hit testing (see `ZHTMLShaderMaterial`).

## Hit Testing (Raycast)

Hit testing is for advanced use cases. You can perform hit tests to determine if the mouse or tap is over an HTML 3D object, and use that to enable or disable interactions, show tooltips, or run other logic.

### Pixel-based: `intersectRenderedPixels`

Renders the scene to an offscreen target with color picking and reads the pixel at the cursor. Use to detect when the cursor is over any HTML (respecting occlusion).

```ts
const raycastQuad = new ZHTMLQuad({ renderAdapter });
const raycast = new ZHTMLRaycast();

const result = raycast.intersectRenderedPixels({
  quad: raycastQuad,
  renderer: htmlRenderer,
  scene,
  camera,
  renderTarget,
  windowX: mouseX,
  windowY: mouseY,
});

if (result) {
  // Cursor is over HTML — e.g. switch to HTML interaction mode
}
```

### Object-based: `intersectRenderedObjects`

Uses Three.js `Raycaster` to intersect scene objects. Returns `ZHTMLRaycastObjectsResult[]` with `html: { object, element, renderTarget }` when the hit is on a `ZHTMLObject3D`, plus the raw `intersection`.

```ts
const results = raycast.intersectRenderedObjects({
  renderer: htmlRenderer,
  scene,
  camera,
  renderTarget,
  windowX: mouseX,
  windowY: mouseY,
});

for (const r of results) {
  if (r.html) {
    console.log('Hit HTML:', r.html.element, r.html.object);
  }
}
```

## ZHTMLOrbitControls

Orbit controls with attach/detach and an `onShouldBegin` callback to conditionally block input (e.g. when over HTML).

```ts
import { ZHTMLOrbitControls } from 'zhtml';

const controls = new ZHTMLOrbitControls(camera);
controls.attach(domElement);  // call detach() when unmounting
controls.enableDamping = true;
controls.zoomSpeed = 0.3;

// Prevent orbit when over HTML (set isOverHTML from raycast each frame)
let isOverHTML = false;
controls.onShouldBegin = () => !isOverHTML;

controls.addEventListener('start', () => { /* e.g. disable HTML hit */ });
controls.addEventListener('end', () => { /* e.g. re-enable */ });

function animate() {
  // ... update isOverHTML from raycast.intersectRenderedPixels() ...
  controls.update();
  // ...
}
```

## Layout Updates

When a `ZHTMLObject3D` moves, rotates, or scales, set `html_needs_layout = true` before rendering. The renderer will call `htmlUpdateLayout` and update the DOM element's CSS transform.

```ts
htmlObject.position.x += 1;
htmlObject.htmlNeedsLayout = true;
htmlRenderer.render({ scene, camera, renderTarget });
```

For cameras, set `camera.htmlNeedsLayout = true` when the camera or its projection changes.

## Typical Render Loop

```ts
function renderLoop() {
  // 1. Update layout flags
  camera.htmlNeedsLayout = true;
  scene.traverse((obj) => {
    if (obj instanceof ZHTMLObject3D) obj.htmlNeedsLayout = true;
  });

  // 2. Render
  htmlRenderer.render({ scene, camera, renderTarget });

  // 3. Update controls
  controls.update();
  requestAnimationFrame(renderLoop);
}
```

Advanced: add hit testing when you need programmatic control over interactions (e.g. to toggle orbit controls when over HTML).

## Demos

The repository includes React demos in `demos/react`, each with three variants:

- **persp** — Perspective camera, single view
- **ortho** — Orthographic camera, isometric-style view
- **stereo** — Stereo camera, split left/right view

### Running Demos

```bash
cd demos/react/persp   # or ortho, stereo
npm install
npm run dev
```

### Local Development (linking zhtml)

From the project root:

```bash
npm run build
cd demos/react/persp
npm install
npm run dev
```

Demo `package.json` files use `"zhtml": "file:../../.."` (or `"file:../../../.."` from sub-packages) to link the local build.

## API Reference

| Export | Description |
|--------|-------------|
| `ZHTMLRenderer` | Main renderer; manages layout, viewport, and CSS transforms |
| `ZHTMLRenderTarget` | Pass scene/camera elements; `registerElementForObject` links objects to HTML |
| `ZHTMLWebGLRenderAdapter` | WebGL render adapter; wraps `THREE.WebGLRenderer` |
| `ZHTMLPerspectiveCamera` | Perspective camera with HTML alignment |
| `ZHTMLOrthographicCamera` | Orthographic camera with HTML alignment |
| `ZHTMLStereoCamera` | Stereo camera with `cameraLeft` and `cameraRight` |
| `ZHTMLObject3D` | 3D object linked to DOM elements |
| `ZHTMLQuad` | Offscreen quad for pixel raycasting |
| `ZHTMLRaycast` | Hit testing (`intersectRenderedPixels`, `intersectRenderedObjects`) |
| `ZHTMLOrbitControls` | Orbit controls with attach/detach and `onShouldBegin` |
| `ZHTMLShaderMaterial` | Base shader material for HTML rendering |
| `ZHTMLMaterialPhong` | Phong material for lit HTML surfaces |
| `ZHTMLInternalMaterialEmbed` | Internal embed material |
| `ZHTMLInternalMaterialOverlay` | Internal overlay material |
| `getCameraTransformStyle` | Utility: camera CSS transform from matrices |
| `getElementTransformStyle` | Utility: element CSS transform from world matrix |

## Troubleshooting

### "Cannot find module 'zhtml'"

The library must be built before use. From the project root: `npm run build`. When developing locally with demos, ensure the root `dist/` folder exists.

### Pink or colored overlay on screen

The hit-detection render pass uses a debug quad. If you see `showQuad` or similar in your code with `showDebugQuad = true`, set it to `false` to hide the overlay. The quad is used internally for pixel-based raycasting; the debug overlay is optional.

### HTML elements not visible

- Ensure you've called `renderTarget.registerElementForObject(object, element)` for each HTML object.
- Ensure the scene and camera elements are passed correctly to `ZHTMLRenderTarget`.
- Call `htmlObject.htmlNeedsLayout = true` before rendering when the object's transform changes.
