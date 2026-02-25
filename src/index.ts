// Render
export { ZHTMLRenderer } from './render/ZHTMLRenderer';
export { ZHTMLRenderTarget } from './render/ZHTMLRenderTarget';

// Render adapters
export type {
  ZHTMLRenderAdapterInterface,
  ZHTMLRenderAdapterOffscreenTargetInterface,
} from './renderAdapters/ZHTMLRenderAdapterInterface';
export { ZHTMLWebGLRenderAdapter } from './renderAdapters/ZHTMLWebGLRenderAdapter';

// Cameras
export type { ZHTMLCameraInterface } from './cameras/ZHTMLCameraInterface';
export type { ZHTMLCameraProviderInterface } from './cameras/ZHTMLCameraProviderInterface';
export { ZHTMLPerspectiveCamera } from './cameras/ZHTMLPerspectiveCamera';
export { ZHTMLOrthographicCamera } from './cameras/ZHTMLOrthographicCamera';
export { ZHTMLStereoCamera, type ZHTMLStereoCameraEye } from './cameras/ZHTMLStereoCamera';

// Controls
export { ZHTMLOrbitControls } from './controls/ZHTMLOrbitControls';

// Objects
export { ZHTMLObject3D } from './objects/ZHTMLObject3D';
export { ZHTMLQuad } from './objects/ZHTMLQuad';

// Geometry solvers
export {
  ZHTMLGeometrySolverPlane,
  type ZHTMLGeometrySolverPlaneConfig,
} from './geometrySolvers/ZHTMLGeometrySolverPlane';

// Raycast
export { ZHTMLRaycast } from './raycast/ZHTMLRaycast';
export type { ZHTMLRaycastPixelsResult } from './raycast/ZHTMLRaycastPixelsResult';
export type { ZHTMLRaycastObjectsResult } from './raycast/ZHTMLRaycastObjectsResult';

// Events
export { ZHTMLRenderEventCanvasResized } from './events/ZHTMLRenderEventCanvasResized';
export { ZHTMLRenderEventWillRender } from './events/ZHTMLRenderEventWillRender';
export { ZHTMLRenderEventEnableColorPicking } from './events/ZHTMLRenderEventEnableColorPicking';
export { ZHTMLRenderEventDisableColorPicking } from './events/ZHTMLRenderEventDisableColorPicking';

// Materials
export {
  FileShaderMaterial,
  type FileShaderMaterialParameters,
} from './materials/FileShaderMaterial';
export {
  ZHTMLShaderMaterial,
  ZHTMLShaderChunk,
} from './materials/ZHTMLShaderMaterial';
export { ZHTMLInternalMaterialEmbed } from './materials/ZHTMLInternalMaterialEmbed';
export { ZHTMLInternalMaterialOverlay } from './materials/ZHTMLInternalMaterialOverlay';
export { ZHTMLMaterialPhong } from './materials/ZHTMLMaterialPhong';

// Utils
export {
  getCameraTransformStyle,
  getElementTransformStyle,
  buildSceneContainer,
  buildCameraContainer,
} from './utils/ZHTMLRendererUtils';
export type {
  ZHTMLRenderMatrix,
  ZHTMLRenderSize,
  ZHTMLRenderFrustum,
  ZHTMLRenderRect,
} from './utils/ZHTMLRendererUtils';
