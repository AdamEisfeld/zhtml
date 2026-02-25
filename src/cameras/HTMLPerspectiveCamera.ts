import * as THREE from 'three';
import { useGetCameraTransformStyle } from '../utils/HTMLRendererUtils';
import { HTMLCameraInterface } from './HTMLCameraInterface';
import { HTMLRenderTarget } from '../render/HTMLRenderTarget';

/**
 * Camera that uses a perspective projection, while aligning HTML elements to the camera's FOV / aspect ratio.
 * @see https://threejs.org/docs/#api/en/cameras/PerspectiveCamera
 */
export class HTMLPerspectiveCamera extends THREE.PerspectiveCamera implements HTMLCameraInterface {
	
	// MARK: - HTMLCameraInterface Properties

	public html_needs_layout: boolean = true;
	
	private _html_transform_id: number = 1;
	private _html_transform_style: string | null = null;
	private _html_applied_bounds: DOMRectReadOnly | null = null;

	public current_render_target: HTMLRenderTarget | null = null;

	// MARK: - HTMLCameraInterface Accessors

	public get html_transform_style(): string | null {
		return this._html_transform_style;
	}

	public get html_transform_id(): number {
		return this._html_transform_id;
	}

	// MARK: - HTMLCameraInterface Methods

	constructor(fov: number, aspect: number, near: number, far: number) {
		super(fov, aspect, near, far);
	}
	
	htmlUpdateLayout(options: { bounds: DOMRectReadOnly }): void {
		if (this.parent === null && this.matrixWorldAutoUpdate === true) {
			this.updateMatrixWorld();
		}
		const anyCamera: THREE.PerspectiveCamera | THREE.OrthographicCamera = this as THREE.PerspectiveCamera | THREE.OrthographicCamera;
		this._html_transform_style = useGetCameraTransformStyle({
			camera_projection_matrix: this.projectionMatrix.elements,
			camera_matrix_world_inverse: this.matrixWorldInverse.elements,
			render_size: {
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
		this._html_transform_id *= -1;
	}

	public willRender(options: { bounds: DOMRectReadOnly }): void {
		if (this._html_applied_bounds?.width === options.bounds.width && this._html_applied_bounds?.height === options.bounds.height) {
			return;
		}
		this._html_applied_bounds = options.bounds;
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
		const scale_height = 2 * Math.tan(THREE.MathUtils.degToRad(this.fov) / 2) * options.distance;
		const scale_width = scale_height * this.aspect;
		return { width: scale_width, height: scale_height };
	}

	public getQuadDistance(options: { width: number, height: number }): number {
		const distance = options.height / (2 * Math.tan(THREE.MathUtils.degToRad(this.fov) / 2));
		return distance;
	}

	public dispose(): void {
	}

}
