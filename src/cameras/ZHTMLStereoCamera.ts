import * as THREE from 'three';
import { ZHTMLPerspectiveCamera } from './ZHTMLPerspectiveCamera';

export type ZHTMLStereoCameraEye = 'left' | 'right';

/**
 * Camera that uses two perspective cameras to render a stereo view, similar to (but does not subclass / inherit from) THREE.StereoCamera.
 * @see https://threejs.org/docs/#api/en/cameras/StereoCamera
 */
export class ZHTMLStereoCamera extends THREE.PerspectiveCamera {


	// MARK: - Public Properties

	readonly camera_left: ZHTMLPerspectiveCamera;
	readonly camera_right: ZHTMLPerspectiveCamera;

	// MARK: - Public Accessors

	public get eye_separation(): number {
		return this.camera_left.position.distanceTo(this.camera_right.position);
	}

	public set eye_separation(value: number) {
		this.camera_left.position.x = -value / 2;
		this.camera_right.position.x = value / 2;
	}

	// MARK: - Constructor

	public constructor(fov: number, aspect: number, near: number, far: number) {
		
		super(fov, aspect, near, far);

		this.camera_left = new ZHTMLPerspectiveCamera(fov, aspect, near, far);
		this.camera_right = new ZHTMLPerspectiveCamera(fov, aspect, near, far);

		this.add(this.camera_left);
		this.add(this.camera_right);

	}

	public dispose(): void {
		this.camera_left.dispose();
		this.camera_right.dispose();
	}

}
