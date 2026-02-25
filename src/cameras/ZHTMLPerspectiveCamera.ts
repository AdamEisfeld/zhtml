import * as THREE from 'three';
import { getCameraTransformStyle } from '../utils/ZHTMLRendererUtils';
import { ZHTMLCameraInterface } from './ZHTMLCameraInterface';
import { ZHTMLRenderTarget } from '../render/ZHTMLRenderTarget';

/**
 * Camera that uses a perspective projection, while aligning HTML elements to the camera's FOV / aspect ratio.
 * @see https://threejs.org/docs/#api/en/cameras/PerspectiveCamera
 */
export class ZHTMLPerspectiveCamera extends THREE.PerspectiveCamera implements ZHTMLCameraInterface {
	
	// MARK: - ZHTMLCameraInterface Properties

	public htmlNeedsLayout: boolean = true;
	
	private _htmlTransformId: number = 1;
	private _htmlTransformStyle: string | null = null;
	private _htmlAppliedBounds: DOMRectReadOnly | null = null;

	public currentRenderTarget: ZHTMLRenderTarget | null = null;

	// MARK: - ZHTMLCameraInterface Accessors

	public get htmlTransformStyle(): string | null {
		return this._htmlTransformStyle;
	}

	public get htmlTransformId(): number {
		return this._htmlTransformId;
	}

	// MARK: - ZHTMLCameraInterface Methods

	constructor(fov: number, aspect: number, near: number, far: number) {
		super(fov, aspect, near, far);
	}
	
	htmlUpdateLayout(options: { bounds: DOMRectReadOnly }): void {
		if (this.parent === null && this.matrixWorldAutoUpdate === true) {
			this.updateMatrixWorld();
		}
		const anyCamera: THREE.PerspectiveCamera | THREE.OrthographicCamera = this as THREE.PerspectiveCamera | THREE.OrthographicCamera;
		this._htmlTransformStyle = getCameraTransformStyle({
			cameraProjectionMatrix: this.projectionMatrix.elements,
			cameraMatrixWorldInverse: this.matrixWorldInverse.elements,
			renderSize: {
				width: options.bounds.width,
				height: options.bounds.height,
			},
			frustum: null,
			subrect: anyCamera.view?.enabled === true ? {
				width: anyCamera.view.fullWidth,
				height: anyCamera.view.fullHeight,
				x: anyCamera.view.offsetX,
				y: anyCamera.view.offsetY,
			} : null,
		});
		this._htmlTransformId *= -1;
	}

	public willRender(options: { bounds: DOMRectReadOnly }): void {
		if (this._htmlAppliedBounds?.width === options.bounds.width && this._htmlAppliedBounds?.height === options.bounds.height) {
			return;
		}
		this._htmlAppliedBounds = options.bounds;
		this.aspect = options.bounds.width / options.bounds.height;
		this.updateProjectionMatrix();
	}

	public showQuad(options: { quad: THREE.Mesh, distance: number, width: number, height: number }): void {
		const scale = this.getQuadScale(options);
		if (options.quad.parent !== this) {
			this.add(options.quad);
		}
		options.quad.scale.set(scale.width, scale.height, 1);
		options.quad.position.set(0, 0, -options.distance);
	}

	public getQuadScale(options: { distance: number, width: number, height: number }): {
		width: number,
		height: number,
	} {
		const scaleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(this.fov) / 2) * options.distance;
		const scaleWidth = scaleHeight * this.aspect;
		return { width: scaleWidth, height: scaleHeight };
	}

	public getQuadDistance(options: { width: number, height: number }): number {
		const distance = options.height / (2 * Math.tan(THREE.MathUtils.degToRad(this.fov) / 2));
		return distance;
	}

	public dispose(): void {
	}

}
