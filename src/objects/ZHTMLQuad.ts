import * as THREE from 'three';
import { ZHTMLRenderAdapterInterface, ZHTMLRenderAdapterOffscreenTargetInterface } from '../renderAdapters/ZHTMLRenderAdapterInterface';

export class ZHTMLQuad extends THREE.Mesh {

	public readonly quadMaterial: THREE.MeshBasicMaterial;
	public readonly quadGeometry: THREE.PlaneGeometry;
	public readonly offscreenTarget: ZHTMLRenderAdapterOffscreenTargetInterface;

	public constructor(options: { renderAdapter: ZHTMLRenderAdapterInterface }) {

		const offscreenTarget = options.renderAdapter.createOffscreenTarget({
			width: 1,
			height: 1,
		});
		const quadMaterial = new THREE.MeshBasicMaterial({
			map: offscreenTarget.texture,
			transparent: true,
		});
		const quadGeometry = new THREE.PlaneGeometry(1, 1);

		super(quadGeometry, quadMaterial);

		this.quadMaterial = quadMaterial;
		this.quadGeometry = quadGeometry;
		this.offscreenTarget = offscreenTarget;

	}

	public render(options: { renderAdapter: ZHTMLRenderAdapterInterface, scene: THREE.Scene, camera: THREE.Camera, size: THREE.Vec2 }): void {
		this.visible = false;
		this.quadMaterial.visible = false;
		options.renderAdapter.renderOffscreenTarget({
			target: this.offscreenTarget,
			scene: options.scene,
			camera: options.camera,
			size: options.size,
		});
		this.visible = true;
		this.quadMaterial.visible = true;
	}

	public readPixelColor(options: { renderAdapter: ZHTMLRenderAdapterInterface, windowX: number, windowY: number, bounds: DOMRectReadOnly }): Float32Array {
		return options.renderAdapter.readPixelFromOffscreenTarget({
			target: this.offscreenTarget,
			windowX: options.windowX,
			windowY: options.windowY,
			bounds: options.bounds,
		});
	}

}
