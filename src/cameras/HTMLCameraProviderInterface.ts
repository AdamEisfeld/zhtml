import * as THREE from 'three';
import { HTMLRenderTarget } from '../render/HTMLRenderTarget';
import { HTMLCameraInterface } from './HTMLCameraInterface';

export interface HTMLCameraProviderInterface {

	// MARK: - Methods

	/**
	 * A flag that is set to true when the camera needs to be laid out again. The renderer uses this internally to determine if it needs to call htmlUpdateLayout() on the camera when ready.
	 */
	html_needs_layout: boolean;

	getCameraTargetPairs(): { camera: THREE.Camera & HTMLCameraInterface, render_target: HTMLRenderTarget | null }[];

	dispose(): void;

}
