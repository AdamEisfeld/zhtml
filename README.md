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
  ZHTMLRenderer,
  ZHTMLRenderTarget,
  ZHTMLWebGLRenderAdapter,
  ZHTMLPerspectiveCamera,
  ZHTMLObject3D,
  ZHTMLInternalMaterialOverlay,
} from 'zhtml';

// Create scene, camera, renderer
const scene = new THREE.Scene();
const camera = new ZHTMLPerspectiveCamera(50, 1, 0.1, 1000);
const threeRenderer = new THREE.WebGLRenderer({ antialias: true });

// Create HTML renderer and render target
const renderAdapter = new ZHTMLWebGLRenderAdapter(threeRenderer);
const htmlRenderer = new ZHTMLRenderer({ render_adapter: renderAdapter });
const renderTarget = new ZHTMLRenderTarget({ type: 'overlay' });

// Add HTML object with geometry
const htmlObject = new ZHTMLObject3D({
  geometry_node: new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new ZHTMLInternalMaterialOverlay()
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
| `ZHTMLRenderer` | Main render loop |
| `ZHTMLRenderTarget` | DOM structure and object-to-element mapping |
| `ZHTMLWebGLRenderAdapter` | WebGL render adapter |
| `ZHTMLPerspectiveCamera` | Perspective camera with HTML alignment |
| `ZHTMLOrthographicCamera` | Orthographic camera |
| `ZHTMLStereoCamera` | Stereo (VR) camera |
| `ZHTMLObject3D` | 3D object linked to DOM elements |
| `ZHTMLQuad` | Offscreen render for pixel raycasting |
| `ZHTMLGeometrySolverPlane` | Helper to sync plane geometry with DOM elements (explicit, implicit, or none) |
| `ZHTMLRaycast` | Hit testing (pixel and object-based) |
| `ZHTMLOrbitControls` | Orbit controls with attach/detach |
| `ZHTMLShaderMaterial` | Base shader material for HTML rendering |
| `ZHTMLInternalMaterialOverlay` | Overlay material |
| `ZHTMLInternalMaterialEmbed` | Embed material (cuts hole in scene) |

See `EXPLAIN.md` for detailed architecture and data flow.
