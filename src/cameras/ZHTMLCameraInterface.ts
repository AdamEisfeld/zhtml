import * as THREE from 'three';

/**
 * Interface for cameras that can be used with ZHTMLRenderer.
 */
export interface ZHTMLCameraInterface {

	// MARK: - Properties

	/**
	 * The transform style for this camera, which will be applied to the camera div tied to this camera's render target.
	 */
	html_transform_style: string | null;

	/**
	 * A flag that is set to true when the camera needs to be laid out again. The renderer uses this internally to determine if it needs to call htmlUpdateLayout() on the camera when ready.
	 */
	html_needs_layout: boolean;

	/**
	 * A number that should change each time the camera's transform style changes. The renderer uses this internally to determine if it has applied the latest transform style to the camera div or not.
	 */
	html_transform_id: number;

	// MARK: - Methods

	/**
	 * Cameras should update their html_transform_style and html_transform_id properties here.
	 */
	htmlUpdateLayout(options: { bounds: DOMRectReadOnly }): void;

	/**
	 * Cameras should re-scale / re-position the provided quad to fill the camera's render target, and add it to their children.
	 * @param options.quad The quad to update.
	 * @param options.distance The distance from the camera to orient the quad.
	 */
	showQuad(options: { quad: THREE.Mesh, distance: number, width: number, height: number }): void;

	/**
	 * Compute the scale of a quad at the given distance from the camera.
	 * @param options.distance The distance from the camera to obtain a scale for.
	 */
	getQuadScale(options: { distance: number, width: number, height: number }): { width: number, height: number };

	/**
	 * Called when the render target's bounds change. Cameras should use this to update things like aspect ratio and projection matrix, if necessary.
	 */
	willRender(options: { bounds: DOMRectReadOnly }): void;

	/**
	 * Disposes of any resources used by the camera.
	 */
	dispose(): void;

}
