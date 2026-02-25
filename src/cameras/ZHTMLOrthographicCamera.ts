import * as THREE from 'three';
import { getCameraTransformStyle } from '../utils/ZHTMLRendererUtils';
import { ZHTMLCameraInterface } from './ZHTMLCameraInterface';
import { ZHTMLRenderTarget } from '../render/ZHTMLRenderTarget';

/**
 * Camera that uses an orthographic projection, while aligning HTML elements to the camera's frustum.
 * @see https://threejs.org/docs/#api/en/cameras/OrthographicCamera
 */
export class ZHTMLOrthographicCamera extends THREE.OrthographicCamera implements ZHTMLCameraInterface {

	// MARK: - ZHTMLCameraInterface Properties

	public htmlNeedsLayout: boolean = true;

	private _htmlTransformStyle: string | null = null;
	private _htmlTransformId: number = 1;
	private _htmlAppliedBounds: DOMRectReadOnly | null = null;

	public currentRenderTarget: ZHTMLRenderTarget | null = null;

	// MARK: - ZHTMLCameraInterface Accessors

	public get htmlTransformStyle(): string | null {
		return this._htmlTransformStyle;
	}

	public get htmlTransformId(): number {
		return this._htmlTransformId;
	}

	public get fov(): number {
		const height = this.top - this.bottom;
		return this.projectionMatrix.elements[5] * (height / 2);
	}

	// MARK: - ZHTMLCameraInterface Methods

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
			frustum: { 
				top: this.top,
				bottom: this.bottom,
				left: this.left,
				right: this.right
			},
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
		this.left = -options.bounds.width / 2;
		this.right = options.bounds.width / 2;
		this.top = options.bounds.height / 2;
		this.bottom = -options.bounds.height / 2;
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
		const { distance } = options;
		const quadHeight = (this.top - this.bottom) * (distance) / this.zoom;
		const quadWidth = (this.right - this.left) * (distance) / this.zoom;
		return {
			width: quadWidth,
			height: quadHeight,
		};

	}

	public dispose(): void {
	}
}
