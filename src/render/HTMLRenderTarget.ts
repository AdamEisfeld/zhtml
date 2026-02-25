import * as THREE from 'three';
import { HTMLObject3D } from '../objects/HTMLObject3D';

export class HTMLRenderTarget {

	readonly uuid: string = THREE.MathUtils.generateUUID();
	readonly type: 'embed' | 'overlay';
	private _scene_element: HTMLElement | null = null;
	private _camera_element: HTMLElement | null = null;

	public get scene_element(): HTMLElement {
		// Return cached if available
		if (this._scene_element) {
			return this._scene_element;
		}
		// Get element using querySelector, must have data-target-uuid of this.uuid and data-type of 'scene'
		const element = document.querySelector(`[data-render-target-uuid="${this.uuid}"][data-render-target-type="scene"]`);
		if (element && element instanceof HTMLElement) {
			this.scene_element = element;
			return element;
		}
		throw new Error('No scene element found');
	}

	private set scene_element(value: HTMLElement) {
		value.style.setProperty('position', 'absolute');
		value.style.setProperty('overflow', 'hidden');
		value.style.setProperty('userSelect', 'none');
		value.style.setProperty('transformOrigin', '0 0');
		this._scene_element = value;
	}

	public get camera_element(): HTMLElement {
		// Return cached if available
		if (this._camera_element) {
			return this._camera_element;
		}
		// Get element using querySelector, must have data-target-uuid of this.uuid and data-type of 'camera'
		const element = document.querySelector(`[data-render-target-uuid="${this.uuid}"][data-render-target-type="camera"]`);
		if (element && element instanceof HTMLElement) {
			this.camera_element = element;
			return element;
		}
		throw new Error('No camera element found');
	}

	private set camera_element(value: HTMLElement) {
		value.style.setProperty('position', 'absolute');
		value.style.setProperty('top', '0px');
		value.style.setProperty('left', '0px');
		value.style.setProperty('width', '100%');
		value.style.setProperty('height', '100%');
		value.style.setProperty('pointerEvents', 'none');
		value.style.setProperty('transform-style', 'preserve-3d');
		this._camera_element = value;
	}
	
	readonly scene_element_uuid: string = THREE.MathUtils.generateUUID();
	readonly camera_element_uuid: string = THREE.MathUtils.generateUUID();

	private _bounds: DOMRectReadOnly = new DOMRectReadOnly();
	private _bounds_resize_id: number = 1;
	private _object_uuid_to_html_element: Record<string, HTMLElement> = {};

	public get bounds(): DOMRectReadOnly {
		return this._bounds;
	}

	public get bounds_resize_id(): number {
		return this._bounds_resize_id;
	}

	public calculateBounds(options: { resize_id: number }): void {
		if (!this.scene_element) {
			return;
		}
		this._bounds = this.scene_element.getBoundingClientRect();
		this._bounds_resize_id = options.resize_id;
	}

	constructor(options: { type: 'embed' | 'overlay' }) {
		this.type = options.type;
	}
	
	public getElementForObject(object: HTMLObject3D): HTMLElement | null {
		const cached_element = this._object_uuid_to_html_element[object.uuid];
		if (cached_element) {
			return cached_element;
		}
		const element = this.camera_element.querySelector(`[data-object-uuid="${object.uuid}"]`);
		if (element && element instanceof HTMLElement) {
			element.style.position = 'absolute';
			element.style.transformStyle = 'preserve-3d';
			element.style.transformOrigin = '50% 50%';
			element.style.backfaceVisibility = 'visible';
			this._object_uuid_to_html_element[object.uuid] = element;
			return element;
		}
		return null;
	}

	dispose(): void {
		this.scene_element.remove();
		this.camera_element.remove();
	}

	enableInteractions(options: { obstructing_elements: HTMLElement[] }): void {
		this.scene_element?.style.setProperty('pointer-events', 'auto');
		this.scene_element?.style.setProperty('user-select', 'auto');
		for (let i = 0, l = options.obstructing_elements.length; i < l; i += 1) {
			const element = options.obstructing_elements[i];
			element.style.setProperty('pointer-events', 'none');
		}
	}

	disableInteractions(options: { obstructing_elements: HTMLElement[] }): void {
		this.scene_element?.style.setProperty('pointer-events', 'none');
		this.scene_element?.style.setProperty('user-select', 'none');
		for (let i = 0, l = options.obstructing_elements.length; i < l; i += 1) {
			const element = options.obstructing_elements[i];
			element.style.setProperty('pointer-events', 'auto');
		}
	}
		
}
