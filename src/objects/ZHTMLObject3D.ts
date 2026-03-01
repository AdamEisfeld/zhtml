import * as THREE from 'three';
import { getElementTransformStyle } from '../utils/ZHTMLRendererUtils';
import { ZHTMLRenderEventWillRender } from '../events/ZHTMLRenderEventWillRender';

// Define your custom events
interface ZHTMLObject3DEventMap {
	willCullElement: {
		element: HTMLElement;
	};
	willUncullElement: {
		element: HTMLElement;
	};
}

// Merge the custom events with THREE's event map
type ZHTMLObject3DExtendedEventMap = THREE.Object3DEventMap & ZHTMLObject3DEventMap;

export class ZHTMLObject3D extends THREE.Object3D {



	// MARK: - Public Properties

	/**
	 * Used to determine if the object's transform style needs to be updated. Set it to true whenever the object's transform changes.
	 */
	public htmlNeedsLayout: boolean = true;


	
	// MARK: - Private Properties

	private _htmlGeometryNode: THREE.Mesh | null = null;
	private _htmlTransformStyle: string | null = null;
	private _htmlTransformId: number = 1;



	// MARK: - Accessors

	// Geometry Node

	/**
	 * The geometry node that will be added to this object's children and used to represent the HTML element(s) in the WebGL world. This node (and it's children, recursively) will get a special material applied that will render the HTML element(s) to the screen.
	 */
	public get htmlGeometryNode(): THREE.Mesh | null {
		return this._htmlGeometryNode;
	}

	// Geometry Nodes

	/**
	 * The geometry nodes that will be added to this object's children and used to represent the HTML element(s) in the WebGL world. These nodes (and their children, recursively) will get a special material applied that will render the HTML element(s) to the screen.
	 */
	public set htmlGeometryNode(value: THREE.Mesh | null) {
		
		if (this._htmlGeometryNode) {
			this.remove(this._htmlGeometryNode);
		}

		this._htmlGeometryNode = value;

		if (!value) {
			return;
		}

		value.onBeforeRender = (renderer: THREE.Renderer) => {

			const event = new ZHTMLRenderEventWillRender({
				object: this,
				renderer: renderer,
			});

			document.dispatchEvent(event);

		};

		this.add(value);
	}

	// Render Type

	// Transform Style

	/**
	 * This is the latest transform style that was generated for the HTML element(s) tied to this object.
	 */
	public get htmlTransformStyle(): string | null {
		return this._htmlTransformStyle;
	}

	// Transform ID

	/**
	 * This is used to determine if the transform style has changed since the last time it was checked.
	 * Internally, the object will update it to some new value whenever the transform style is updated.
	 */
	public get htmlTransformId(): number {
		return this._htmlTransformId;
	}




	// MARK: - Constructor

	/**
	 * @param options.geometryNode The geometry node that will be added to this object's children and used to represent the HTML element(s) in the WebGL world.
	 */
	public constructor(options?: { geometryNode?: THREE.Mesh }) {
		super();
		this.htmlGeometryNode = options?.geometryNode === undefined ? null : options.geometryNode;
	}



	// MARK: - Custom Event Overrides

	// Override the dispatchEvent method
	public dispatchEvent<T extends keyof ZHTMLObject3DExtendedEventMap>(event: THREE.BaseEvent<T> & ZHTMLObject3DExtendedEventMap[T]): void {
		super.dispatchEvent(event as unknown as THREE.BaseEvent<keyof THREE.Object3DEventMap> & THREE.Object3DEventMap[keyof THREE.Object3DEventMap]);
	}

	public addEventListener<T extends keyof ZHTMLObject3DExtendedEventMap>(type: T, listener: (event: ZHTMLObject3DExtendedEventMap[T]) => void): void {
		super.addEventListener(type as keyof THREE.Object3DEventMap, listener as (event: THREE.Object3DEventMap[keyof THREE.Object3DEventMap]) => void);
	}
	
	public removeEventListener<T extends keyof ZHTMLObject3DExtendedEventMap>(type: T, listener: (event: ZHTMLObject3DExtendedEventMap[T]) => void): void {
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
		this._htmlTransformStyle = getElementTransformStyle({
			elementMatrixWorld: this.matrixWorld.elements,
		});
		this._htmlTransformId *= -1;
	}

}
