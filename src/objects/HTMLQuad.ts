import * as THREE from 'three';
import { HTMLRenderAdapterInterface, HTMLRenderAdapterOffscreenTargetInterface } from '../render_adapters/HTMLRenderAdapterInterface';

export class HTMLQuad extends THREE.Mesh {

	public readonly quad_material: THREE.MeshBasicMaterial;
	public readonly quad_geometry: THREE.PlaneGeometry;
	public readonly offscreen_target: HTMLRenderAdapterOffscreenTargetInterface;

	public constructor(options: { render_adapter: HTMLRenderAdapterInterface }) {

		const offscreen_target = options.render_adapter.createOffscreenTarget({
			width: 1,
			height: 1,
		});
		const quad_material = new THREE.MeshBasicMaterial({
			map: offscreen_target.texture,
			transparent: true,
		});
		const quad_geometry = new THREE.PlaneGeometry(1, 1);

		super(quad_geometry, quad_material);

		this.quad_material = quad_material;
		this.quad_geometry = quad_geometry;
		this.offscreen_target = offscreen_target;

	}

	public render(options: { render_adapter: HTMLRenderAdapterInterface, scene: THREE.Scene, camera: THREE.Camera, size: THREE.Vec2 }): void {
		this.visible = false;
		this.quad_material.visible = false;
		options.render_adapter.renderOffscreenTarget({
			target: this.offscreen_target,
			scene: options.scene,
			camera: options.camera,
			size: options.size,
		});
		this.visible = true;
		this.quad_material.visible = true;
	}

	public readPixelColor(options: { render_adapter: HTMLRenderAdapterInterface, window_x: number, window_y: number, bounds: DOMRectReadOnly }): Float32Array {
		return options.render_adapter.readPixelFromOffscreenTarget({
			target: this.offscreen_target,
			window_x: options.window_x,
			window_y: options.window_y,
			bounds: options.bounds,
		});
	}

}
