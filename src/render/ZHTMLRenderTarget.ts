import * as THREE from 'three';
import { ZHTMLObject3D } from '../objects/ZHTMLObject3D';

export class ZHTMLRenderTarget {

	readonly uuid: string = THREE.MathUtils.generateUUID();
	readonly type: 'embed' | 'overlay';
	private _sceneElement: HTMLElement | null = null;
	private _cameraElement: HTMLElement | null = null;

	public get sceneElement(): HTMLElement {
		// Return cached if available
		if (this._sceneElement) {
			return this._sceneElement;
		}
		// Get element using querySelector, must have data-target-uuid of this.uuid and data-type of 'scene'
		const element = document.querySelector(`[data-render-target-uuid="${this.uuid}"][data-render-target-type="scene"]`);
		if (element && element instanceof HTMLElement) {
			this.sceneElement = element;
			return element;
		}
		throw new Error('No scene element found');
	}

	private set sceneElement(value: HTMLElement) {
		value.style.setProperty('position', 'absolute');
		value.style.setProperty('overflow', 'hidden');
		value.style.setProperty('userSelect', 'none');
		value.style.setProperty('transformOrigin', '0 0');
		this._sceneElement = value;
	}

	public get cameraElement(): HTMLElement {
		// Return cached if available
		if (this._cameraElement) {
			return this._cameraElement;
		}
		// Get element using querySelector, must have data-target-uuid of this.uuid and data-type of 'camera'
		const element = document.querySelector(`[data-render-target-uuid="${this.uuid}"][data-render-target-type="camera"]`);
		if (element && element instanceof HTMLElement) {
			this.cameraElement = element;
			return element;
		}
		throw new Error('No camera element found');
	}

	private set cameraElement(value: HTMLElement) {
		value.style.setProperty('position', 'absolute');
		value.style.setProperty('top', '0px');
		value.style.setProperty('left', '0px');
		value.style.setProperty('width', '100%');
		value.style.setProperty('height', '100%');
		value.style.setProperty('pointerEvents', 'none');
		value.style.setProperty('transform-style', 'preserve-3d');
		this._cameraElement = value;
	}
	
	readonly sceneElementUuid: string = THREE.MathUtils.generateUUID();
	readonly cameraElementUuid: string = THREE.MathUtils.generateUUID();

	private _bounds: DOMRectReadOnly = new DOMRectReadOnly();
	private _boundsResizeId: number = 1;
	private _objectUuidToHtmlElement: Record<string, HTMLElement> = {};

	public get bounds(): DOMRectReadOnly {
		return this._bounds;
	}

	public get boundsResizeId(): number {
		return this._boundsResizeId;
	}

	public calculateBounds(options: { resizeId: number }): void {
		if (!this.sceneElement) {
			return;
		}
		this._bounds = this.sceneElement.getBoundingClientRect();
		this._boundsResizeId = options.resizeId;
	}

	constructor(options: { type: 'embed' | 'overlay' }) {
		this.type = options.type;
	}
	
	public getElementForObject(object: ZHTMLObject3D): HTMLElement | null {
		const cachedElement = this._objectUuidToHtmlElement[object.uuid];
		if (cachedElement) {
			return cachedElement;
		}
		const element = this.cameraElement.querySelector(`[data-object-uuid="${object.uuid}"]`);
		if (element && element instanceof HTMLElement) {
			element.style.position = 'absolute';
			element.style.transformStyle = 'preserve-3d';
			element.style.transformOrigin = '50% 50%';
			element.style.backfaceVisibility = 'visible';
			this._objectUuidToHtmlElement[object.uuid] = element;
			return element;
		}
		return null;
	}

	dispose(): void {
		this.sceneElement.remove();
		this.cameraElement.remove();
	}

	enableInteractions(options: { obstructingElements: HTMLElement[] }): void {
		this.sceneElement?.style.setProperty('pointer-events', 'auto');
		this.sceneElement?.style.setProperty('user-select', 'auto');
		for (let i = 0, l = options.obstructingElements.length; i < l; i += 1) {
			const element = options.obstructingElements[i];
			element.style.setProperty('pointer-events', 'none');
		}
	}

	disableInteractions(options: { obstructingElements: HTMLElement[] }): void {
		this.sceneElement?.style.setProperty('pointer-events', 'none');
		this.sceneElement?.style.setProperty('user-select', 'none');
		for (let i = 0, l = options.obstructingElements.length; i < l; i += 1) {
			const element = options.obstructingElements[i];
			element.style.setProperty('pointer-events', 'auto');
		}
	}
		
}
