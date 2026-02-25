// Render
export { HTMLRenderer } from './render/HTMLRenderer';
export { HTMLRenderTarget } from './render/HTMLRenderTarget';

// Render adapters
export type {
  HTMLRenderAdapterInterface,
  HTMLRenderAdapterOffscreenTargetInterface,
} from './render_adapters/HTMLRenderAdapterInterface';
export { HTMLWebGLRenderAdapter } from './render_adapters/HTMLWebGLRenderAdapter';

// Cameras
export type { HTMLCameraInterface } from './cameras/HTMLCameraInterface';
export type { HTMLCameraProviderInterface } from './cameras/HTMLCameraProviderInterface';
export { HTMLPerspectiveCamera } from './cameras/HTMLPerspectiveCamera';
export { HTMLOrthographicCamera } from './cameras/HTMLOrthographicCamera';
export { HTMLStereoCamera, type HTMLStereoCameraEye } from './cameras/HTMLStereoCamera';

// Controls
export { HTMLOrbitControls } from './controls/HTMLOrbitControls';

// Objects
export { HTMLObject3D } from './objects/HTMLObject3D';
export { HTMLQuad } from './objects/HTMLQuad';

// Geometry solvers
export {
  HTMLGeometrySolverPlane,
  type HTMLGeometrySolverPlaneConfig,
} from './geometry_solvers/HTMLGeometrySolverPlane';

// Raycast
export { HTMLRaycast } from './raycast/HTMLRaycast';
export type { HTMLRaycastPixelsResult } from './raycast/HTMLRaycastPixelsResult';
export type { HTMLRaycastObjectsResult } from './raycast/HTMLRaycastObjectsResult';

// Events
export { HTMLRenderEventCanvasResized } from './events/HTMLRenderEventCanvasResized';
export { HTMLRenderEventWillRender } from './events/HTMLRenderEventWillRender';
export { HTMLRenderEventEnableColorPicking } from './events/HTMLRenderEventEnableColorPicking';
export { HTMLRenderEventDisableColorPicking } from './events/HTMLRenderEventDisableColorPicking';

// Materials
export {
  FileShaderMaterial,
  type FileShaderMaterialParameters,
} from './materials/FileShaderMaterial';
export {
  HTMLShaderMaterial,
  HTMLShaderChunk,
} from './materials/HTMLShaderMaterial';
export { HTMLInternalMaterialEmbed } from './materials/HTMLInternalMaterialEmbed';
export { HTMLInternalMaterialOverlay } from './materials/HTMLInternalMaterialOverlay';
export { HTMLMaterialPhong } from './materials/HTMLMaterialPhong';

// Utils
export {
  useGetCameraTransformStyle,
  useGetElementTransformStyle,
  useBuildSceneContainer,
  useBuildCameraContainer,
} from './utils/HTMLRendererUtils';
export type {
  HTMLRenderMatrix,
  HTMLRenderSize,
  HTMLRenderFrustum,
  HTMLRenderRect,
} from './utils/HTMLRendererUtils';
