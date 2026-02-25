import * as THREE from 'three';
import { useGetElementTransformStyle } from '../utils/HTMLRendererUtils';
import { HTMLRenderEventWillRender } from '../events/HTMLRenderEventWillRender';

// Define your custom events
interface HTMLObject3DEventMap {
	willCullElement: {
		element: HTMLElement;
	};
	willUncullElement: {
		element: HTMLElement;
	};
}

// Merge the custom events with THREE's event map
type HTMLObject3DExtendedEventMap = THREE.Object3DEventMap & HTMLObject3DEventMap;

export class HTMLObject3D extends THREE.Object3D {



	// MARK: - Public Properties

	/**
	 * Used to determine if the object's transform style needs to be updated. Set it to true whenever the object's transform changes.
	 */
	public html_needs_layout: boolean = true;


	
	// MARK: - Private Properties

	private _html_geometry_node: THREE.Mesh | null = null;
	private _html_transform_style: string | null = null;
	private _html_transform_id: number = 1;



	// MARK: - Accessors

	// Geometry Node

	/**
	 * The geometry node that will be added to this object's children and used to represent the HTML element(s) in the WebGL world. This node (and it's children, recursively) will get a special material applied that will render the HTML element(s) to the screen.
	 */
	public get html_geometry_node(): THREE.Mesh | null {
		return this._html_geometry_node;
	}

	// Geometry Nodes

	/**
	 * The geometry nodes that will be added to this object's children and used to represent the HTML element(s) in the WebGL world. These nodes (and their children, recursively) will get a special material applied that will render the HTML element(s) to the screen.
	 */
	public set html_geometry_node(value: THREE.Mesh | null) {
		
		if (this._html_geometry_node) {
			this.remove(this._html_geometry_node);
		}

		this._html_geometry_node = value;

		if (!value) {
			return;
		}

		value.onBeforeRender = (renderer: THREE.Renderer) => {

			const event = new HTMLRenderEventWillRender({
				object: this,
				renderer: renderer,
			});

			document.dispatchEvent(event);

		};

		this.add(value);
	}

	// Elements

	/**
	 * Returns all HTML elements that are tied to this object in the DOM.
	 */
	public getAllElements(): HTMLElement[] {
		return document.querySelectorAll(`[data-object-uuid="${this.uuid}"]`) as unknown as HTMLElement[];
	}

	// Render Type

	// Transform Style

	/**
	 * This is the latest transform style that was generated for the HTML element(s) tied to this object.
	 */
	public get html_transform_style(): string | null {
		return this._html_transform_style;
	}

	// Transform ID

	/**
	 * This is used to determine if the transform style has changed since the last time it was checked.
	 * Internally, the object will update it to some new value whenever the transform style is updated.
	 */
	public get html_transform_id(): number {
		return this._html_transform_id;
	}




	// MARK: - Constructor

	/**
	 * @param options.geometry_node The geometry node that will be added to this object's children and used to represent the HTML element(s) in the WebGL world.
	 */
	public constructor(options?: { geometry_node?: THREE.Mesh }) {
		super();
		this.html_geometry_node = options?.geometry_node === undefined ? null : options.geometry_node;
	}



	// MARK: - Custom Event Overrides

	// Override the dispatchEvent method
	public dispatchEvent<T extends keyof HTMLObject3DExtendedEventMap>(event: THREE.BaseEvent<T> & HTMLObject3DExtendedEventMap[T]): void {
		super.dispatchEvent(event as unknown as THREE.BaseEvent<keyof THREE.Object3DEventMap> & THREE.Object3DEventMap[keyof THREE.Object3DEventMap]);
	}

	public addEventListener<T extends keyof HTMLObject3DExtendedEventMap>(type: T, listener: (event: HTMLObject3DExtendedEventMap[T]) => void): void {
		super.addEventListener(type as keyof THREE.Object3DEventMap, listener as (event: THREE.Object3DEventMap[keyof THREE.Object3DEventMap]) => void);
	}
	
	public removeEventListener<T extends keyof HTMLObject3DExtendedEventMap>(type: T, listener: (event: HTMLObject3DExtendedEventMap[T]) => void): void {
		super.removeEventListener(type as keyof THREE.Object3DEventMap, listener as (event: THREE.Object3DEventMap[keyof THREE.Object3DEventMap]) => void);
	}



	// MARK: - Custom Events

	/**
	 * Called just before an HTML element tied to this object is about to be culled (hidden) due to the object's geometry
	 * being outside of the camera's frustum.
	 * Do not call this method directly. It is called internally by the renderer.
	 */
	public onWillCullElement(options: { element: HTMLElement }): void {
		this.dispatchEvent({
			type: 'willCullElement',
			element: options.element,
		});
	}

	/**
	 * Called just before an HTML element tied to this object is about to be unculled (shown) due to the object's geometry
	 * being inside of the camera's frustum.
	 * Do not call this method directly. It is called internally by the renderer.
	 */
	public onWillUncullElement(options: { element: HTMLElement }): void {
		this.dispatchEvent({
			type: 'willUncullElement',
			element: options.element,
		});
	}

	// MARK: - Public Methods

	/**
	 * Rebuilds the CSS transform style for the HTML element(s) tied to this object.
	 */
	public htmlUpdateLayout() {
		this._html_transform_style = useGetElementTransformStyle({
			elementMatrixWorld: this.matrixWorld.elements,
		});
		this._html_transform_id *= -1;
	}

}
