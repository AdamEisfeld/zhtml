# zhtml

**Three.js HTML renderer** — render HTML elements in 3D by mapping DOM elements to WebGL geometry via CSS transforms. Unlike CSS3DRenderer, zhtml integrates HTML into the WebGL depth buffer so HTML can be occluded by 3D geometry, receive scene lighting and shadows, and participate in proper depth ordering.

## Features

- **Depth integration** — HTML is rendered as geometry in the WebGL scene; 3D objects can occlude HTML and vice versa
- **Scene lighting** — HTML surfaces can receive shadows and participate in Phong lighting via `ZHTMLMaterialPhong`
- **Multiple camera types** — Perspective, orthographic, and stereo (VR) cameras with built-in HTML alignment
- **Hit testing** — Pixel-based and object-based raycasting to detect when the cursor is over HTML vs 3D geometry (optional, for advanced use)
- **Interaction management** — Camera div and GL container use pointer-events so orbit controls and HTML inputs work correctly; optional programmatic control via hit testing
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

// 1. Create Three.js scene and WebGL renderer
const scene = new THREE.Scene();
const glRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
glRenderer.shadowMap.enabled = true;

// 2. Create zhtml renderer and render target
const renderAdapter = new ZHTMLWebGLRenderAdapter(glRenderer);
const htmlRenderer = new ZHTMLRenderer({ renderAdapter });
const renderTarget = new ZHTMLRenderTarget();

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

// 5. Mount: append renderer.element to your container, and ensure DOM structure exists
// (see DOM Structure section below)
document.getElementById('gl-container')!.appendChild(htmlRenderer.element);

// 6. Animation loop
function animate() {
  requestAnimationFrame(animate);
  htmlObject.htmlNeedsLayout = true;
  htmlRenderer.render({ scene, camera, renderTarget });
}
animate();
```

## DOM Structure

zhtml requires a specific DOM structure so it can find and position HTML elements. The render target looks for elements by `data-render-target-uuid` and `data-render-target-type`, and HTML content must use `data-object-uuid` to match `ZHTMLObject3D` instances.

### Embed vs Overlay

Div ordering determines how HTML and WebGL compose:

- **Embed** — Two overlapping divs: scene first (containing the camera div with your HTML object divs), then the GL container. The GL view renders on top of the HTML layer. Use the embed material on the mesh backing your HTML objects so it "cuts out" the WebGL render, revealing the HTML below. The scene div must contain the camera div within it.

- **Overlay** — Opposite order: GL container first, then the scene. Use the overlay material on the mesh so the GL is not cut out; HTML appears on top.

### Required Structure (Embed)

```html
<!-- Scene container: must have data-render-target-uuid and data-render-target-type="scene" -->
<div data-render-target-uuid="<renderTarget.uuid>" data-render-target-type="scene"
     style="position: absolute; width: 100%; height: 100%;">
  <!-- Camera container: holds HTML elements, receives camera CSS transform. Use pointer-events: none; user-select: none so it does not capture events. -->
  <div data-render-target-uuid="<renderTarget.uuid>" data-render-target-type="camera"
       style="position: absolute; width: 100%; height: 100%; pointer-events: none; user-select: none;">
    <!-- HTML content: must have data-object-uuid matching your ZHTMLObject3D.uuid -->
    <div data-object-uuid="<htmlObject.uuid>" style="position: absolute; width: 400px; height: 300px;">
      <div style="width: 100%; height: 100%; background: blue; color: white;">
        Your HTML content here
      </div>
    </div>
  </div>
</div>
<!-- WebGL canvas container: place the renderer.element here. Use pointer-events: none so it does not capture mouse events. -->
<div name="gl_container" style="position: absolute; width: 100%; height: 100%; pointer-events: none;"></div>
```

For overlay, use the same structure but place the GL container before the scene div.

The WebGL canvas (`htmlRenderer.element`) and the scene/camera divs must be siblings within the same positioned container. The render target's `sceneElement` and `cameraElement` are resolved via `document.querySelector` using the render target's UUID. Use `buildSceneContainer` and `buildCameraContainer` from `zhtml` if creating the structure programmatically; you must still add the `data-render-target-uuid` and `data-render-target-type` attributes to link them to your render target.

### Interactive HTML Objects

To make an HTML 3D object interactive (inputs, buttons, scroll, etc.), enable pointer-events and user-select on its content div using CSS (e.g. `pointer-events: auto; user-select: auto` on the inner div that holds the actual content).

The GL container has `pointer-events: none`, so it does not capture mouse events. Orbit controls (or similar) attach to the DOM and receive events when the cursor is over empty space. When the cursor is over an interactive HTML element, that element captures the event and orbit controls do not receive it. No raycasting is needed for basic interaction switching.

## Render Targets

### Programmatic Interaction Control

For advanced use cases where you need programmatic control over which layer receives events (e.g. a different interaction model), use `enableInteractions` and `disableInteractions`. With the default setup—camera div `pointer-events: none`, content divs `pointer-events: auto`, and GL container `pointer-events: none`—interactions work without calling these methods.

```ts
// Enable pointer events on the HTML layer and disable them on the WebGL canvas
renderTarget.enableInteractions({ obstructingElements: [renderAdapter.domElement] });

// Disable pointer events on the HTML layer and re-enable them on the WebGL canvas
renderTarget.disableInteractions({ obstructingElements: [renderAdapter.domElement] });
```

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
- **`getAllElements()`** — Returns all DOM elements with `data-object-uuid` matching this object's UUID.

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
  // Cursor is over HTML — e.g. enable programmatic interaction control
  renderTarget.enableInteractions({ obstructingElements: [renderAdapter.domElement] });
} else {
  renderTarget.disableInteractions({ obstructingElements: [renderAdapter.domElement] });
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

Advanced: add hit testing when you need programmatic control over interactions:

```ts
const hit = raycast.intersectRenderedPixels({ quad, renderer, scene, camera, renderTarget, windowX: mx, windowY: my });
if (hit) renderTarget.enableInteractions({ obstructingElements: [renderAdapter.domElement] });
else renderTarget.disableInteractions({ obstructingElements: [renderAdapter.domElement] });
```

## Demos

The repository includes Vue and React demos in `demos/vue` and `demos/react`, each with three variants:

- **persp** — Perspective camera, single view
- **ortho** — Orthographic camera, isometric-style view
- **stereo** — Stereo camera, split left/right view

### Running Demos

```bash
# Vue demos
cd demos/vue
npm install
npm run dev:persp   # or dev:ortho, dev:stereo

# React demos
cd demos/react
npm install
npm run dev:persp   # or dev:ortho, dev:stereo
```

### Local Development (linking zhtml)

From the project root:

```bash
npm run build
cd demos/vue
npm install
npm run dev:persp
```

Demo `package.json` files use `"zhtml": "file:../../.."` (or `"file:../../../.."` from sub-packages) to link the local build.

## API Reference

| Export | Description |
|--------|-------------|
| `ZHTMLRenderer` | Main renderer; manages layout, viewport, and CSS transforms |
| `ZHTMLRenderTarget` | DOM structure and object-to-element mapping; embed or overlay |
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
| `buildSceneContainer` | Utility: create scene div |
| `buildCameraContainer` | Utility: create camera div |

## Troubleshooting

### "Cannot find module 'zhtml'"

The library must be built before use. From the project root: `npm run build`. When developing locally with demos, ensure the root `dist/` folder exists.

### Pink or colored overlay on screen

The hit-detection render pass uses a debug quad. If you see `showQuad` or similar in your code with `showDebugQuad = true`, set it to `false` to hide the overlay. The quad is used internally for pixel-based raycasting; the debug overlay is optional.

### HTML elements not visible

- Ensure each HTML container has `data-object-uuid` matching the `ZHTMLObject3D.uuid`.
- Ensure the render target's scene/camera divs have the correct `data-render-target-uuid` and `data-render-target-type`.
- Call `htmlObject.htmlNeedsLayout = true` before rendering when the object's transform changes.
