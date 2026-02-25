import * as THREE from 'three';

export interface HTMLRenderAdapterOffscreenTargetInterface {

	texture: THREE.Texture;

}

export interface HTMLRenderAdapterInterface {

	readonly domElement: HTMLCanvasElement;

	render(options: { scene: THREE.Scene, camera: THREE.Camera, rectangle?: { x: number, y: number, width: number, height: number } }): void;

	setSize(width: number, height: number): void;

	createOffscreenTarget(options: { width: number, height: number }): HTMLRenderAdapterOffscreenTargetInterface;

	renderOffscreenTarget(options: { target: HTMLRenderAdapterOffscreenTargetInterface, scene: THREE.Scene, camera: THREE.Camera, size: THREE.Vec2 }): void;

	readPixelFromOffscreenTarget(options: { target: HTMLRenderAdapterOffscreenTargetInterface, window_x: number, window_y: number, bounds: DOMRectReadOnly }): Float32Array;

	isRenderer(renderer: THREE.Renderer): boolean;

	dispose(): void;

}
