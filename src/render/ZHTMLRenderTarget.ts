import * as THREE from 'three';
import { ZHTMLObject3D } from '../objects/ZHTMLObject3D';

export class ZHTMLRenderTarget {

	readonly uuid: string = THREE.MathUtils.generateUUID();

	private _sceneElement: HTMLElement | null = null;
	private _cameraElement: HTMLElement | null = null;
	private _bounds: DOMRectReadOnly = new DOMRectReadOnly();
	private _boundsResizeId: number = 1;
	private _objectUuidToHtmlElement: Record<string, HTMLElement> = {};

	constructor(options: { sceneElement: HTMLElement; cameraElement: HTMLElement }) {
		this._sceneElement = options.sceneElement;
		this._cameraElement = options.cameraElement;

		options.sceneElement.style.setProperty('position', 'absolute');
		options.sceneElement.style.setProperty('overflow', 'hidden');
		options.sceneElement.style.setProperty('userSelect', 'none');
		options.sceneElement.style.setProperty('transformOrigin', '0 0');

		options.cameraElement.style.setProperty('position', 'absolute');
		options.cameraElement.style.setProperty('top', '0px');
		options.cameraElement.style.setProperty('left', '0px');
		options.cameraElement.style.setProperty('width', '100%');
		options.cameraElement.style.setProperty('height', '100%');
		options.cameraElement.style.setProperty('pointerEvents', 'none');
		options.cameraElement.style.setProperty('transform-style', 'preserve-3d');
		options.cameraElement.style.setProperty('user-select', 'none');
	}

	public get sceneElement(): HTMLElement {
		if (!this._sceneElement) {
			throw new Error('Render target has been disposed');
		}
		return this._sceneElement;
	}

	public get cameraElement(): HTMLElement {
		if (!this._cameraElement) {
			throw new Error('Render target has been disposed');
		}
		return this._cameraElement;
	}

	public get bounds(): DOMRectReadOnly {
		return this._bounds;
	}

	public get boundsResizeId(): number {
		return this._boundsResizeId;
	}

	public registerElementForObject(object: ZHTMLObject3D, element: HTMLElement): void {
		element.style.position = 'absolute';
		element.style.transformStyle = 'preserve-3d';
		element.style.transformOrigin = '50% 50%';
		element.style.backfaceVisibility = 'visible';
		this._objectUuidToHtmlElement[object.uuid] = element;
	}

	public unregisterObject(object: ZHTMLObject3D): void {
		delete this._objectUuidToHtmlElement[object.uuid];
	}

	public calculateBounds(options: { resizeId: number }): void {
		if (!this._sceneElement) {
			return;
		}
		this._bounds = this._sceneElement.getBoundingClientRect();
		this._boundsResizeId = options.resizeId;
	}

	public getElementForObject(object: ZHTMLObject3D): HTMLElement | null {
		return this._objectUuidToHtmlElement[object.uuid] ?? null;
	}

	dispose(): void {
		this._sceneElement = null;
		this._cameraElement = null;
		this._objectUuidToHtmlElement = {};
	}

}
