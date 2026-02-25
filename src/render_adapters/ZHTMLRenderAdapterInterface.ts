import * as THREE from 'three';

export interface ZHTMLRenderAdapterOffscreenTargetInterface {

	texture: THREE.Texture;

}

export interface ZHTMLRenderAdapterInterface {

	readonly domElement: HTMLCanvasElement;

	render(options: { scene: THREE.Scene, camera: THREE.Camera, rectangle?: { x: number, y: number, width: number, height: number } }): void;

	setSize(width: number, height: number): void;

	createOffscreenTarget(options: { width: number, height: number }): ZHTMLRenderAdapterOffscreenTargetInterface;

	renderOffscreenTarget(options: { target: ZHTMLRenderAdapterOffscreenTargetInterface, scene: THREE.Scene, camera: THREE.Camera, size: THREE.Vec2 }): void;

	readPixelFromOffscreenTarget(options: { target: ZHTMLRenderAdapterOffscreenTargetInterface, window_x: number, window_y: number, bounds: DOMRectReadOnly }): Float32Array;

	isRenderer(renderer: THREE.Renderer): boolean;

	dispose(): void;

}
