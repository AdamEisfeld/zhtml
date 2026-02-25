import * as THREE from 'three';
import { ZHTMLCameraInterface } from '../cameras/ZHTMLCameraInterface';
import { ZHTMLObject3D } from '../objects/ZHTMLObject3D';
import { ZHTMLRenderEventWillRender } from '../events/ZHTMLRenderEventWillRender';
import { ZHTMLRenderEventCanvasResized } from '../events/ZHTMLRenderEventCanvasResized';
import { ZHTMLRenderAdapterInterface } from '../renderAdapters/ZHTMLRenderAdapterInterface';
import { ZHTMLRenderTarget } from './ZHTMLRenderTarget';

export class ZHTMLRenderer {

	private _renderAdapter: ZHTMLRenderAdapterInterface;
	private _renderTargetUuidsToRenderedObjectsThisFrame: Record<string, Record<string, ZHTMLObject3D>> = {};
	private _renderTargetUuidsToRenderedObjectsLastFrame: Record<string, Record<string, ZHTMLObject3D>> = {};
	private _renderTargetUuidsToCameraTransformIds: Record<string, number> = {};
	private _renderTargetUuidsToObjectTransformIds: Record<string, Record<string, number>> = {};
	private _currentRenderTarget: ZHTMLRenderTarget | null = null;
	private _canvasResizeObserver: ResizeObserver | null = null;
	private _canvasBounds: DOMRectReadOnly = new DOMRectReadOnly();
	private _canvasResizeId: number = 1;
	private _element: HTMLElement;
	public get element(): HTMLElement {
		return this._element;
	}
	public htmlRendererUuid: string = THREE.MathUtils.generateUUID();
	public get renderAdapter(): ZHTMLRenderAdapterInterface {
		return this._renderAdapter;
	}

	public get canvasBounds(): DOMRectReadOnly {
		return this._canvasBounds;
	}

	constructor(options: { renderAdapter: ZHTMLRenderAdapterInterface, element?: HTMLElement }) {

		this._renderAdapter = options.renderAdapter;
		if (!options.element) {
			this._element = document.createElement('div');
			this.element.style.setProperty('position', 'absolute');
			this.element.style.setProperty('top', '0px');
			this.element.style.setProperty('left', '0px');
			this.element.style.setProperty('width', '100%');
			this.element.style.setProperty('height', '100%');
			this.element.style.setProperty('overflow', 'hidden');
		} else {
			this._element = options.element;
		}
		this._renderAdapter.domElement.style.position = 'absolute';
		this._renderAdapter.domElement.style.top = '0px';
		this._renderAdapter.domElement.style.left = '0px';
		this._renderAdapter.domElement.style.width = '100%';
		this._renderAdapter.domElement.style.height = '100%';
		this._element.appendChild(this._renderAdapter.domElement);
		this._canvasResizeObserver = new ResizeObserver(() => {
			this._canvasBounds = this._element.getBoundingClientRect();
			this._canvasResizeId *= -1;
			document.dispatchEvent(new ZHTMLRenderEventCanvasResized({
				element: this._element,
				bounds: this._canvasBounds,
			}));
		});
		this._canvasResizeObserver.observe(this._element);

		document.addEventListener(ZHTMLRenderEventWillRender.eventName, (event: Event) => {
			
			if (!(event instanceof ZHTMLRenderEventWillRender)) {
				return;
			}

			if (!(event.object instanceof ZHTMLObject3D)) {
				return;
			}

			if (!this._currentRenderTarget) {
				return;
			}

			if (this._renderAdapter.isRenderer(event.renderer) === false) {
				return;
			}
			
			// Store the object uuid for the camera that rendered it
			const mutableObjectUuids = this._renderTargetUuidsToRenderedObjectsThisFrame[this._currentRenderTarget.uuid] || {};
			mutableObjectUuids[event.object.uuid] = event.object;
			this._renderTargetUuidsToRenderedObjectsThisFrame[this._currentRenderTarget.uuid] = mutableObjectUuids;
		
		});

	}

	public getRenderedObjects(): ZHTMLObject3D[] {
		const renderTargetUuids = Object.keys(this._renderTargetUuidsToRenderedObjectsThisFrame);
		const visibleObjects: Record<string, ZHTMLObject3D> = {};
		for (let i = 0, l = renderTargetUuids.length; i < l; i += 1) {
			const renderTargetUuid = renderTargetUuids[i];
			const objectUuids = Object.keys(this._renderTargetUuidsToRenderedObjectsThisFrame[renderTargetUuid]);
			for (let j = 0, m = objectUuids.length; j < m; j += 1) {
				const objectUuid = objectUuids[j];
				const object = this._renderTargetUuidsToRenderedObjectsThisFrame[renderTargetUuid][objectUuid];
				visibleObjects[object.uuid] = object;
			}
		}
		return Object.values(visibleObjects);
	}

	public render(options: { scene: THREE.Scene, camera: THREE.Camera & ZHTMLCameraInterface, renderTarget: ZHTMLRenderTarget }): void {
		
		const { scene, camera, renderTarget } = options;
		
		if (!renderTarget) {
			throw new Error('Cannot render without a render target');
		}

		this._currentRenderTarget = renderTarget;

		if (this._canvasResizeId !== renderTarget.boundsResizeId) {
			renderTarget.calculateBounds({
				resizeId: this._canvasResizeId,
			});
		}

		// MARK: - Step 1
		// Inform the camera that it is about to render so it can prepare itself for the current bounds if needed
		
		camera.willRender({
			bounds: renderTarget.bounds,
		});

		// MARK: - Step 3
		// Render the WebGL scene (ensuring the viewport matches the render target's bounds)

		this.renderAdapter.setSize(this._canvasBounds.width, this._canvasBounds.height);
		this.renderAdapter.render({
			scene: scene,
			camera: camera,
			rectangle: {
				x: renderTarget.bounds.left - this._canvasBounds.left,
				y: renderTarget.bounds.top - this._canvasBounds.top,
				width: renderTarget.bounds.width,
				height: renderTarget.bounds.height,
			}
		});

		// MARK: - Step 4
		// Rebuild the camera's CSS transform if needed
		if (camera.htmlNeedsLayout === true) {
			camera.htmlUpdateLayout({
				bounds: renderTarget.bounds,
			});
			camera.htmlNeedsLayout = false;
		}

		// MARK: - Step 5
		// Apply the rebuilt CSS transform to the camera div if needed
		if (this._renderTargetUuidsToCameraTransformIds[renderTarget.uuid] !== camera.htmlTransformId) {
			renderTarget.cameraElement.style.setProperty('transform', camera.htmlTransformStyle ?? '');
			this._renderTargetUuidsToCameraTransformIds[renderTarget.uuid] = camera.htmlTransformId;
		}

		// MARK: - Step 6
		// Ensure any objects rendered by the camera this frame are visible and have updated transforms
		const mutableObjectUuidsShownThisFrame: Record<string, ZHTMLObject3D> = {};
		const mutableRenderTargetUuidsToObjectUuidsShownLastFrameNotThisFrame: Record<string, ZHTMLObject3D> = this._renderTargetUuidsToRenderedObjectsLastFrame[renderTarget.uuid] ?? {};
		const objectsToShow = this._renderTargetUuidsToRenderedObjectsThisFrame[renderTarget.uuid] ?? {};
		const objectUuidsToShow = Object.keys(objectsToShow);
		for (let i = 0, l = objectUuidsToShow.length; i < l; i += 1) {

			const uuid = objectUuidsToShow[i];
			const object = objectsToShow[uuid];
			if (!object) {
				throw new Error(`Cannot find object with uuid ${uuid}`);
			}
			
			const element = renderTarget.getElementForObject(object);
			if (!element) {
				console.warn('Cannot find element');
				continue;
			}

			// Rebuild the object's CSS transform if needed
			if (object.htmlNeedsLayout === true) {
				object.htmlUpdateLayout();
				object.htmlNeedsLayout = false;
			}

			// Ensure the HTML element is visible
			if (element.style.display !== 'block') {
				element.style.display = 'block';
				object.onWillUncullElement({
					element: element,
				});
			}

			// Apply the object's CSS transform if needed
			const objectTransforms = this._renderTargetUuidsToObjectTransformIds[renderTarget.uuid] ?? {};
			if (objectTransforms[uuid] !== object.htmlTransformId) {
				element.style.setProperty('transform', object.htmlTransformStyle ?? '');
				objectTransforms[uuid] = object.htmlTransformId;
				this._renderTargetUuidsToObjectTransformIds[renderTarget.uuid] = objectTransforms;
			}

			mutableObjectUuidsShownThisFrame[uuid] = object;
			delete mutableRenderTargetUuidsToObjectUuidsShownLastFrameNotThisFrame[uuid];

		}

		// MARK: - Step 7
		// Store the object uuids shown this frame. We will use this to determine which objects we need to hide next frame, by comparing the object uuids we show next frame with the object uuids we showed last frame.
		this._renderTargetUuidsToRenderedObjectsLastFrame[renderTarget.uuid] = mutableObjectUuidsShownThisFrame;
		this._renderTargetUuidsToRenderedObjectsThisFrame[renderTarget.uuid] = {};

		// MARK: - Step 8
		// Hide any elements that were not rendered by this camera this frame
		const objectsToHide = mutableRenderTargetUuidsToObjectUuidsShownLastFrameNotThisFrame;
		const objectUuidsToHide = Object.keys(objectsToHide);
		for (let i = 0, l = objectUuidsToHide.length; i < l; i += 1) {
			const uuid = objectUuidsToHide[i];
			const object = objectsToHide[uuid];
			if (!object) {
				throw new Error(`Cannot find object with uuid ${uuid}`);
			}

			const element = renderTarget.getElementForObject(object);
			if (!element) {
				console.warn('Cannot find element');
				continue;
			}

			// Ensure the HTML element is hidden
			if (element.style.display === 'none') {
				continue;
			}
			element.style.display = 'none';
			object.onWillCullElement({
				element: element,
			});

		}

		this._currentRenderTarget = null;

	}

	public dispose(): void {
		this.renderAdapter.dispose();
		this._renderTargetUuidsToCameraTransformIds = {};
		this._renderTargetUuidsToObjectTransformIds = {};
		this._renderTargetUuidsToRenderedObjectsThisFrame = {};
		this._renderTargetUuidsToRenderedObjectsLastFrame = {};
		this._canvasResizeObserver?.disconnect();
		this._canvasResizeObserver = null;
	}

}
