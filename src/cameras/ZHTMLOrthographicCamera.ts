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

	public html_needs_layout: boolean = true;

	private _html_transform_style: string | null = null;
	private _html_transform_id: number = 1;
	private _html_applied_bounds: DOMRectReadOnly | null = null;

	public current_render_target: ZHTMLRenderTarget | null = null;

	// MARK: - ZHTMLCameraInterface Accessors

	public get html_transform_style(): string | null {
		return this._html_transform_style;
	}

	public get html_transform_id(): number {
		return this._html_transform_id;
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
		this._html_transform_style = getCameraTransformStyle({
			camera_projection_matrix: this.projectionMatrix.elements,
			camera_matrix_world_inverse: this.matrixWorldInverse.elements,
			render_size: {
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
		this._html_transform_id *= -1;
	}

	public willRender(options: { bounds: DOMRectReadOnly }): void {
		if (this._html_applied_bounds?.width === options.bounds.width && this._html_applied_bounds?.height === options.bounds.height) {
			return;
		}
		this._html_applied_bounds = options.bounds;
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
		const quad_height = (this.top - this.bottom) * (distance) / this.zoom;
		const quad_width = (this.right - this.left) * (distance) / this.zoom;
		return {
			width: quad_width,
			height: quad_height,
		};

	}

	public dispose(): void {
	}
}
