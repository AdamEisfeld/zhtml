import * as THREE from 'three';
import { HTMLCameraInterface } from '../cameras/HTMLCameraInterface';
import { HTMLRenderer } from '../render/HTMLRenderer';
import { HTMLRaycastPixelsResult } from './HTMLRaycastPixelsResult';
import { HTMLRaycastObjectsResult } from './HTMLRaycastObjectsResult';
import { HTMLQuad } from '../objects/HTMLQuad';
import { HTMLObject3D } from '../objects/HTMLObject3D';
import { HTMLRenderTarget } from '../render/HTMLRenderTarget';
import { HTMLRenderEventEnableColorPicking } from '../events/HTMLRenderEventEnableColorPicking';
import { HTMLRenderEventDisableColorPicking } from '../events/HTMLRenderEventDisableColorPicking';
import { HTMLShaderMaterial } from '../materials/HTMLShaderMaterial';

export class HTMLRaycast {

	intersectRenderedPixels(options: { quad: HTMLQuad, renderer: HTMLRenderer, scene: THREE.Scene, camera: THREE.Camera & HTMLCameraInterface, render_target: HTMLRenderTarget, window_x: number, window_y: number }): HTMLRaycastPixelsResult | null {

		const render_target = options.render_target;

		if (render_target.bounds.width === 0 || render_target.bounds.height === 0) {
			console.warn(`Cannot hit test with a render target that has a width or height of 0. Ensure you have set the render target's layout property to the bounds you wish to render.`, render_target.bounds.width, render_target.bounds.height);
			return null;
		}

		document.dispatchEvent(new HTMLRenderEventEnableColorPicking());

		options.quad.render({
			render_adapter: options.renderer.render_adapter,
			scene: options.scene,
			camera: options.camera,
			size: new THREE.Vector2(render_target.bounds.width, render_target.bounds.height),
		});
		
		document.dispatchEvent(new HTMLRenderEventDisableColorPicking());
		
		// Read the pixel color at the mouse position
		const read = options.renderer.render_adapter.readPixelFromOffscreenTarget({
			target: options.quad.offscreen_target,
			window_x: options.window_x,
			window_y: options.window_y,
			bounds: render_target.bounds,
		});
		
		const pixel_test_color = HTMLShaderMaterial.HTML_PIXEL_TEST_COLOR;
		const hit_pixel_test = read[0] === pixel_test_color.r && read[1] === pixel_test_color.g && read[2] === pixel_test_color.b;
		if (!hit_pixel_test) {
			return null;
		}

		// If the pixel color is the test color, then the mouse is over an HTML element in the scene (and that part of the
		// HTML element is not occluded by geometry in the scene)
		return {
			render_target: render_target,
		};

	}

	intersectRenderedObjects(options: { renderer: HTMLRenderer, scene: THREE.Scene, camera: THREE.Camera & HTMLCameraInterface, render_target: HTMLRenderTarget, window_x: number, window_y: number }): HTMLRaycastObjectsResult[] {

		const render_target = options.render_target;

		if (render_target.bounds.width === 0 || render_target.bounds.height === 0) {
			console.warn(`Cannot hit test with a render target that has a width or height of 0. Ensure you have set the render target's layout property to the bounds you wish to render.`, render_target.bounds.width, render_target.bounds.height);
			return [];
		}

		const objects = options.renderer.getRenderedObjects();
		const raycast = new THREE.Raycaster();
		const mouse_coordinates_in_window = new THREE.Vector2(options.window_x, options.window_y);
		const mouse_coordinates_in_scene = new THREE.Vector2(mouse_coordinates_in_window.x - render_target.bounds.left, mouse_coordinates_in_window.y - render_target.bounds.top);
		const mouse_coordinates_ndc = new THREE.Vector2(
			(mouse_coordinates_in_scene.x / render_target.bounds.width) * 2 - 1,
			(mouse_coordinates_in_scene.y / render_target.bounds.height) * -2 + 1
		);
		raycast.setFromCamera(mouse_coordinates_ndc, options.camera);
		const intersections = raycast.intersectObjects(objects, true);
		
		if (intersections.length === 0) {
			return [];
		}

		const results: HTMLRaycastObjectsResult[] = intersections.map((intersection) => {
			let html_object: HTMLObject3D | null = null;
			intersection.object.traverseAncestors((ancestor) => {
				if (ancestor instanceof HTMLObject3D) {
					html_object = ancestor;
					return;
				}
			});
			const html_element = html_object ? render_target.getElementForObject(html_object) : null;
			return {
				html: html_object !== null && html_element !== null ? {
					object: html_object,
					element: html_element,
					render_target: render_target,
				} : null,
				intersection: intersection,
			};
		});

		return results;

	}

}
