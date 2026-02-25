import * as THREE from 'three';

/**
 * This event is dispatched before one of the geometry meshs of an HTMLObject3D is rendered. We use this internally
 * to determine which objects have been culled each frame so that we only update the CSS transforms of objects in-view
 * (and hide any elements that belong to objects not in-view).
 */
export class HTMLRenderEventWillRender extends Event {

	public readonly object: unknown;
	public readonly renderer: THREE.Renderer;

	public static readonly event_name = 'HTMLRenderEventWillRender';

	constructor(options: { object: unknown, renderer: THREE.Renderer }) {
		super(HTMLRenderEventWillRender.event_name);
		this.object = options.object;
		this.renderer = options.renderer;
	}

}
