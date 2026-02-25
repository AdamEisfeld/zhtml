import * as THREE from 'three';
import { ZHTMLRenderTarget } from '../render/ZHTMLRenderTarget';
import { ZHTMLCameraInterface } from './ZHTMLCameraInterface';

export interface ZHTMLCameraProviderInterface {

	// MARK: - Methods

	/**
	 * A flag that is set to true when the camera needs to be laid out again. The renderer uses this internally to determine if it needs to call htmlUpdateLayout() on the camera when ready.
	 */
	htmlNeedsLayout: boolean;

	getCameraTargetPairs(): { camera: THREE.Camera & ZHTMLCameraInterface, renderTarget: ZHTMLRenderTarget | null }[];

	dispose(): void;

}
