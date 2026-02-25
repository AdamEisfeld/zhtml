# zhtml

Three.js HTML renderer — render HTML elements in 3D by mapping DOM elements to WebGL geometry via CSS transforms.

## Installation

```bash
npm install zhtml three
```

## Usage

```ts
import * as THREE from 'three';
import {
  HTMLRenderer,
  HTMLRenderTarget,
  HTMLWebGLRenderAdapter,
  HTMLPerspectiveCamera,
  HTMLObject3D,
  HTMLInternalMaterialOverlay,
} from 'zhtml';

// Create scene, camera, renderer
const scene = new THREE.Scene();
const camera = new HTMLPerspectiveCamera(50, 1, 0.1, 1000);
const threeRenderer = new THREE.WebGLRenderer({ antialias: true });

// Create HTML renderer and render target
const renderAdapter = new HTMLWebGLRenderAdapter(threeRenderer);
const htmlRenderer = new HTMLRenderer({ render_adapter: renderAdapter });
const renderTarget = new HTMLRenderTarget({ type: 'overlay' });

// Add HTML object with geometry
const htmlObject = new HTMLObject3D({
  geometry_node: new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new HTMLInternalMaterialOverlay()
  ),
});
scene.add(htmlObject);

// In your animation loop
function animate() {
  requestAnimationFrame(animate);
  htmlRenderer.render({ scene, camera, render_target: renderTarget });
}
```

## Peer Dependencies

- **three** (^0.159.0) — required

## API Overview

| Export | Description |
|--------|-------------|
| `HTMLRenderer` | Main render loop |
| `HTMLRenderTarget` | DOM structure and object-to-element mapping |
| `HTMLWebGLRenderAdapter` | WebGL render adapter |
| `HTMLPerspectiveCamera` | Perspective camera with HTML alignment |
| `HTMLOrthographicCamera` | Orthographic camera |
| `HTMLStereoCamera` | Stereo (VR) camera |
| `HTMLObject3D` | 3D object linked to DOM elements |
| `HTMLQuad` | Offscreen render for pixel raycasting |
| `HTMLGeometrySolverPlane` | Helper to sync plane geometry with DOM elements (explicit, implicit, or none) |
| `HTMLRaycast` | Hit testing (pixel and object-based) |
| `HTMLOrbitControls` | Orbit controls with attach/detach |
| `HTMLShaderMaterial` | Base shader material for HTML rendering |
| `HTMLInternalMaterialOverlay` | Overlay material |
| `HTMLInternalMaterialEmbed` | Embed material (cuts hole in scene) |

See `EXPLAIN.md` for detailed architecture and data flow.
