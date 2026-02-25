import * as THREE from 'three';
import { HTMLRenderAdapterInterface, HTMLRenderAdapterOffscreenTargetInterface } from './HTMLRenderAdapterInterface';

export class HTMLWebGLRenderAdapterOffscreenTarget implements HTMLRenderAdapterOffscreenTargetInterface {

	_gl_render_target: THREE.WebGLRenderTarget;
	_material: THREE.MeshBasicMaterial;

	get texture(): THREE.Texture {
		return this._gl_render_target.texture;
	}

	constructor(gl_render_target: THREE.WebGLRenderTarget) {
		this._gl_render_target = gl_render_target;
		this._material = new THREE.MeshBasicMaterial({
			map: this._gl_render_target.texture,
			transparent: true,
			depthTest: false,
			depthWrite: false,
		});
	}

}

export class HTMLWebGLRenderAdapter implements HTMLRenderAdapterInterface {

	public get domElement(): HTMLCanvasElement {
		return this._renderer.domElement;
	}

	private _renderer: THREE.WebGLRenderer;
	
	constructor(renderer: THREE.WebGLRenderer) {
		this._renderer = renderer;
	}

	public render(options: { scene: THREE.Scene, camera: THREE.Camera, rectangle?: { x: number, y: number, width: number, height: number } }): void {
		if (options.rectangle) {
			this._renderer.setViewport(options.rectangle.x, options.rectangle.y, options.rectangle.width, options.rectangle.height);
			this._renderer.setScissor(options.rectangle.x, options.rectangle.y, options.rectangle.width, options.rectangle.height);
			this._renderer.setScissorTest(true);
		}
		this._renderer.render(options.scene, options.camera);
	}

	public setSize(width: number, height: number): void {
		this._renderer.setSize(width, height);
	}

	public createOffscreenTarget(options: { width: number, height: number }): HTMLRenderAdapterOffscreenTargetInterface {
		const gl_render_target = new THREE.WebGLRenderTarget(options.width, options.height, {
			format: THREE.RGBAFormat,
			stencilBuffer: false,
			depthBuffer: true,
			magFilter: THREE.NearestFilter,
			minFilter: THREE.LinearFilter,
			type: THREE.FloatType,
		});
		return new HTMLWebGLRenderAdapterOffscreenTarget(gl_render_target);
	}

	public renderOffscreenTarget(options: { target: HTMLRenderAdapterOffscreenTargetInterface, scene: THREE.Scene, camera: THREE.Camera, size: THREE.Vec2 }): void {
		const target_adapter = options.target as HTMLWebGLRenderAdapterOffscreenTarget;
		if (!(target_adapter instanceof HTMLWebGLRenderAdapterOffscreenTarget)) {
			throw new Error('Invalid target');
		}
		
		const original_render_target = this._renderer.getRenderTarget();
		target_adapter._gl_render_target.setSize(options.size.x, options.size.y);
		this._renderer.setRenderTarget(target_adapter._gl_render_target);
		this._renderer.clear();
		this._renderer.render(options.scene, options.camera);
		this._renderer.setRenderTarget(original_render_target);
	}

	// TODO: Move window origin subtraction layer up
	public readPixelFromOffscreenTarget(options: { target: HTMLRenderAdapterOffscreenTargetInterface, window_x: number, window_y: number, bounds: DOMRectReadOnly }): Float32Array {
		const target_adapter = options.target as HTMLWebGLRenderAdapterOffscreenTarget;
		if (!(target_adapter instanceof HTMLWebGLRenderAdapterOffscreenTarget)) {
			throw new Error('Invalid target');
		}
		
		const read = new Float32Array(4);
		this._renderer.readRenderTargetPixels(target_adapter._gl_render_target, options.window_x - options.bounds.left, options.bounds.height - (options.window_y - options.bounds.top), 1, 1, read);
		return read;
	}

	public isRenderer(renderer: THREE.Renderer): boolean {
		return this._renderer === renderer;
	}

	public dispose(): void {
		this._renderer.renderLists.dispose();
		this._renderer.dispose();
	}

}
