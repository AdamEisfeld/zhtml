import * as THREE from 'three';
import { ZHTMLRenderAdapterInterface, ZHTMLRenderAdapterOffscreenTargetInterface } from './ZHTMLRenderAdapterInterface';

export class ZHTMLWebGLRenderAdapterOffscreenTarget implements ZHTMLRenderAdapterOffscreenTargetInterface {

	_glRenderTarget: THREE.WebGLRenderTarget;

	get texture(): THREE.Texture {
		return this._glRenderTarget.texture;
	}

	constructor(glRenderTarget: THREE.WebGLRenderTarget) {
		this._glRenderTarget = glRenderTarget;
	}

}

export class ZHTMLWebGLRenderAdapter implements ZHTMLRenderAdapterInterface {

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

	public createOffscreenTarget(options: { width: number, height: number }): ZHTMLRenderAdapterOffscreenTargetInterface {
		const glRenderTarget = new THREE.WebGLRenderTarget(options.width, options.height, {
			format: THREE.RGBAFormat,
			stencilBuffer: false,
			depthBuffer: true,
			magFilter: THREE.NearestFilter,
			minFilter: THREE.LinearFilter,
			type: THREE.FloatType,
		});
		return new ZHTMLWebGLRenderAdapterOffscreenTarget(glRenderTarget);
	}

	public renderOffscreenTarget(options: { target: ZHTMLRenderAdapterOffscreenTargetInterface, scene: THREE.Scene, camera: THREE.Camera, size: THREE.Vec2 }): void {
		const targetAdapter = options.target as ZHTMLWebGLRenderAdapterOffscreenTarget;
		if (!(targetAdapter instanceof ZHTMLWebGLRenderAdapterOffscreenTarget)) {
			throw new Error('Invalid target');
		}
		
		const originalRenderTarget = this._renderer.getRenderTarget();
		targetAdapter._glRenderTarget.setSize(options.size.x, options.size.y);
		this._renderer.setRenderTarget(targetAdapter._glRenderTarget);

		// Ensure full viewport and no scissor clipping - previous main render may have left viewport/scissor in canvas coords
		this._renderer.setViewport(0, 0, options.size.x, options.size.y);
		this._renderer.setScissorTest(false);
		this._renderer.clear();
		this._renderer.render(options.scene, options.camera);
		this._renderer.setScissorTest(true);

		this._renderer.setRenderTarget(originalRenderTarget);
	}

	// TODO: Move window origin subtraction layer up
	public readPixelFromOffscreenTarget(options: { target: ZHTMLRenderAdapterOffscreenTargetInterface, windowX: number, windowY: number, bounds: DOMRectReadOnly }): Float32Array {
		const targetAdapter = options.target as ZHTMLWebGLRenderAdapterOffscreenTarget;
		if (!(targetAdapter instanceof ZHTMLWebGLRenderAdapterOffscreenTarget)) {
			throw new Error('Invalid target');
		}
		
		const read = new Float32Array(4);
		this._renderer.readRenderTargetPixels(targetAdapter._glRenderTarget, options.windowX - options.bounds.left, options.bounds.height - (options.windowY - options.bounds.top), 1, 1, read);
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
