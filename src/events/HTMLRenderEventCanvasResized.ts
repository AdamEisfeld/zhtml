/**
 * This event is dispatched whenever the canvas for an HTMLRenderer changes size.
 */
export class HTMLRenderEventCanvasResized extends Event {

	public readonly element: HTMLElement;
	public readonly bounds: DOMRectReadOnly;

	public static readonly event_name = 'HTMLRenderEventCanvasResized';

	constructor(options: { element: HTMLElement, bounds: DOMRectReadOnly }) {
		super(HTMLRenderEventCanvasResized.event_name);
		this.element = options.element;
		this.bounds = options.bounds;
	}

}
