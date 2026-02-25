import * as THREE from "three";
import { HTMLObject3D } from "../objects/HTMLObject3D";
import { HTMLRenderTarget } from "../render/HTMLRenderTarget";

export type HTMLRaycastObjectsResult = {
	html: {
		element: HTMLElement,
		object: HTMLObject3D,
		render_target: HTMLRenderTarget,
	} | null,
	intersection: THREE.Intersection,
};
