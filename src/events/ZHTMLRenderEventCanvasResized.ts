/**
 * This event is dispatched whenever the canvas for an ZHTMLRenderer changes size.
 */
export class ZHTMLRenderEventCanvasResized extends Event {

	public readonly element: HTMLElement;
	public readonly bounds: DOMRectReadOnly;

	public static readonly event_name = 'ZHTMLRenderEventCanvasResized';

	constructor(options: { element: HTMLElement, bounds: DOMRectReadOnly }) {
		super(ZHTMLRenderEventCanvasResized.event_name);
		this.element = options.element;
		this.bounds = options.bounds;
	}

}
