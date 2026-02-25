import * as THREE from 'three';
import { ZHTMLPerspectiveCamera } from './ZHTMLPerspectiveCamera';

export type ZHTMLStereoCameraEye = 'left' | 'right';

/**
 * Camera that uses two perspective cameras to render a stereo view, similar to (but does not subclass / inherit from) THREE.StereoCamera.
 * @see https://threejs.org/docs/#api/en/cameras/StereoCamera
 */
export class ZHTMLStereoCamera extends THREE.PerspectiveCamera {


	// MARK: - Public Properties

	readonly cameraLeft: ZHTMLPerspectiveCamera;
	readonly cameraRight: ZHTMLPerspectiveCamera;

	// MARK: - Public Accessors

	public get eyeSeparation(): number {
		return this.cameraLeft.position.distanceTo(this.cameraRight.position);
	}

	public set eyeSeparation(value: number) {
		this.cameraLeft.position.x = -value / 2;
		this.cameraRight.position.x = value / 2;
	}

	// MARK: - Constructor

	public constructor(fov: number, aspect: number, near: number, far: number) {
		
		super(fov, aspect, near, far);

		this.cameraLeft = new ZHTMLPerspectiveCamera(fov, aspect, near, far);
		this.cameraRight = new ZHTMLPerspectiveCamera(fov, aspect, near, far);

		this.add(this.cameraLeft);
		this.add(this.cameraRight);

	}

	public dispose(): void {
		this.cameraLeft.dispose();
		this.cameraRight.dispose();
	}

}
