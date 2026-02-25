import * as THREE from "three";
import { ZHTMLObject3D } from "../objects/ZHTMLObject3D";
import { ZHTMLRenderTarget } from "../render/ZHTMLRenderTarget";

export type ZHTMLRaycastObjectsResult = {
	html: {
		element: HTMLElement,
		object: ZHTMLObject3D,
		renderTarget: ZHTMLRenderTarget,
	} | null,
	intersection: THREE.Intersection,
};
