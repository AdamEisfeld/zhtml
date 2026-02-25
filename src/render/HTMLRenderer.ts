import * as THREE from 'three';
import { HTMLCameraInterface } from '../cameras/HTMLCameraInterface';
import { HTMLObject3D } from '../objects/HTMLObject3D';
import { HTMLRenderEventWillRender } from '../events/HTMLRenderEventWillRender';
import { HTMLRenderEventCanvasResized } from '../events/HTMLRenderEventCanvasResized';
import { HTMLRenderAdapterInterface } from '../render_adapters/HTMLRenderAdapterInterface';
import { HTMLRenderTarget } from './HTMLRenderTarget';

export class HTMLRenderer {

	private _render_adapter: HTMLRenderAdapterInterface;
	private _render_target_uuids_to_rendered_objects_this_frame: Record<string, Record<string, HTMLObject3D>> = {};
	private _render_target_uuids_to_rendered_objects_last_frame: Record<string, Record<string, HTMLObject3D>> = {};
	private _render_target_uuids_to_camera_transform_ids: Record<string, number> = {};
	private _render_target_uuids_to_object_transform_ids: Record<string, Record<string, number>> = {};
	private _current_render_target: HTMLRenderTarget | null = null;
	private _canvas_resize_observer: ResizeObserver | null = null;
	private _canvas_bounds: DOMRectReadOnly = new DOMRectReadOnly();
	private _canvas_resize_id: number = 1;
	private _element: HTMLElement;
	public get element(): HTMLElement {
		return this._element;
	}
	public html_renderer_uuid: string = THREE.MathUtils.generateUUID();
	public get render_adapter(): HTMLRenderAdapterInterface {
		return this._render_adapter;
	}

	public get canvas_bounds(): DOMRectReadOnly {
		return this._canvas_bounds;
	}

	constructor(options: { render_adapter: HTMLRenderAdapterInterface, element?: HTMLElement }) {

		this._render_adapter = options.render_adapter;
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
		this._render_adapter.domElement.style.position = 'absolute';
		this._render_adapter.domElement.style.top = '0px';
		this._render_adapter.domElement.style.left = '0px';
		this._render_adapter.domElement.style.width = '100%';
		this._render_adapter.domElement.style.height = '100%';
		this._element.appendChild(this._render_adapter.domElement);
		this._canvas_resize_observer = new ResizeObserver(() => {
			this._canvas_bounds = this._element.getBoundingClientRect();
			this._canvas_resize_id *= -1;
			document.dispatchEvent(new HTMLRenderEventCanvasResized({
				element: this._element,
				bounds: this._canvas_bounds,
			}));
		});
		this._canvas_resize_observer.observe(this._element);

		document.addEventListener(HTMLRenderEventWillRender.event_name, (event: Event) => {
			
			if (!(event instanceof HTMLRenderEventWillRender)) {
				return;
			}

			if (!(event.object instanceof HTMLObject3D)) {
				return;
			}

			if (!this._current_render_target) {
				return;
			}

			if (this._render_adapter.isRenderer(event.renderer) === false) {
				return;
			}
			
			// Store the object uuid for the camera that rendered it
			const mutable_object_uuids = this._render_target_uuids_to_rendered_objects_this_frame[this._current_render_target.uuid] || {};
			mutable_object_uuids[event.object.uuid] = event.object;
			this._render_target_uuids_to_rendered_objects_this_frame[this._current_render_target.uuid] = mutable_object_uuids;
		
		});

	}

	public getRenderedObjects(): HTMLObject3D[] {
		const render_target_uuids = Object.keys(this._render_target_uuids_to_rendered_objects_this_frame);
		const visible_objects: Record<string, HTMLObject3D> = {};
		for (let i = 0, l = render_target_uuids.length; i < l; i += 1) {
			const render_target_uuid = render_target_uuids[i];
			const object_uuids = Object.keys(this._render_target_uuids_to_rendered_objects_this_frame[render_target_uuid]);
			for (let j = 0, m = object_uuids.length; j < m; j += 1) {
				const object_uuid = object_uuids[j];
				const object = this._render_target_uuids_to_rendered_objects_this_frame[render_target_uuid][object_uuid];
				visible_objects[object.uuid] = object;
			}
		}
		return Object.values(visible_objects);
	}

	public render(options: { scene: THREE.Scene, camera: THREE.Camera & HTMLCameraInterface, render_target: HTMLRenderTarget }): void {
		
		const { scene, camera, render_target } = options;
		
		if (!render_target) {
			throw new Error('Cannot render without a render target');
		}

		this._current_render_target = render_target;

		if (this._canvas_resize_id !== render_target.bounds_resize_id) {
			render_target.calculateBounds({
				resize_id: this._canvas_resize_id,
			});
		}

		// MARK: - Step 1
		// Inform the camera that it is about to render so it can prepare itself for the current bounds if needed
		
		camera.willRender({
			bounds: render_target.bounds,
		});

		// MARK: - Step 3
		// Render the WebGL scene (ensuring the viewport matches the render target's bounds)

		this.render_adapter.setSize(this._canvas_bounds.width, this._canvas_bounds.height);
		this.render_adapter.render({
			scene: scene,
			camera: camera,
			rectangle: {
				x: render_target.bounds.left - this._canvas_bounds.left,
				y: render_target.bounds.top - this._canvas_bounds.top,
				width: render_target.bounds.width,
				height: render_target.bounds.height,
			}
		});

		// MARK: - Step 4
		// Rebuild the camera's CSS transform if needed
		if (camera.html_needs_layout === true) {
			camera.htmlUpdateLayout({
				bounds: render_target.bounds,
			});
			camera.html_needs_layout = false;
		}

		// MARK: - Step 5
		// Apply the rebuilt CSS transform to the camera div if needed
		if (this._render_target_uuids_to_camera_transform_ids[render_target.uuid] !== camera.html_transform_id) {
			render_target.camera_element.style.setProperty('transform', camera.html_transform_style ?? '');
			this._render_target_uuids_to_camera_transform_ids[render_target.uuid] = camera.html_transform_id;
		}

		// MARK: - Step 6
		// Ensure any objects rendered by the camera this frame are visible and have updated transforms
		const mutable_object_uuids_shown_this_frame: Record<string, HTMLObject3D> = {};
		const mutable_render_target_uuids_to_object_uuids_shown_last_frame_not_this_frame: Record<string, HTMLObject3D> = this._render_target_uuids_to_rendered_objects_last_frame[render_target.uuid] ?? {};
		const objects_to_show = this._render_target_uuids_to_rendered_objects_this_frame[render_target.uuid] ?? {};
		const object_uuids_to_show = Object.keys(objects_to_show);
		for (let i = 0, l = object_uuids_to_show.length; i < l; i += 1) {

			const uuid = object_uuids_to_show[i];
			const object = objects_to_show[uuid];
			if (!object) {
				throw new Error(`Cannot find object with uuid ${uuid}`);
			}
			
			const element = render_target.getElementForObject(object);
			if (!element) {
				console.warn('Cannot find element');
				continue;
			}

			// Rebuild the object's CSS transform if needed
			if (object.html_needs_layout === true) {
				object.htmlUpdateLayout();
				object.html_needs_layout = false;
			}

			// Ensure the HTML element is visible
			if (element.style.display !== 'block') {
				element.style.display = 'block';
				object.onWillUncullElement({
					element: element,
				});
			}

			// Apply the object's CSS transform if needed
			const object_transforms = this._render_target_uuids_to_object_transform_ids[render_target.uuid] ?? {};
			if (object_transforms[uuid] !== object.html_transform_id) {
				element.style.setProperty('transform', object.html_transform_style);
				object_transforms[uuid] = object.html_transform_id;
				this._render_target_uuids_to_object_transform_ids[render_target.uuid] = object_transforms;
			}

			mutable_object_uuids_shown_this_frame[uuid] = object;
			delete mutable_render_target_uuids_to_object_uuids_shown_last_frame_not_this_frame[uuid];

		}

		// MARK: - Step 7
		// Store the object uuids shown this frame. We will use this to determine which objects we need to hide next frame, by comparing the object uuids we show next frame with the object uuids we showed last frame.
		this._render_target_uuids_to_rendered_objects_last_frame[render_target.uuid] = mutable_object_uuids_shown_this_frame;
		this._render_target_uuids_to_rendered_objects_this_frame[render_target.uuid] = {};

		// MARK: - Step 8
		// Hide any elements that were not rendered by this camera this frame
		const objects_to_hide = mutable_render_target_uuids_to_object_uuids_shown_last_frame_not_this_frame;
		const object_uuids_to_hide = Object.keys(objects_to_hide);
		for (let i = 0, l = object_uuids_to_hide.length; i < l; i += 1) {
			const uuid = object_uuids_to_hide[i];
			const object = objects_to_hide[uuid];
			if (!object) {
				throw new Error(`Cannot find object with uuid ${uuid}`);
			}

			const element = render_target.getElementForObject(object);
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

		this._current_render_target = null;

	}

	public dispose(): void {
		this.render_adapter.dispose();
		this._render_target_uuids_to_camera_transform_ids = {};
		this._render_target_uuids_to_object_transform_ids = {};
		this._render_target_uuids_to_rendered_objects_this_frame = {};
		this._render_target_uuids_to_rendered_objects_last_frame = {};
		this._canvas_resize_observer?.disconnect();
		this._canvas_resize_observer = null;
	}

}
