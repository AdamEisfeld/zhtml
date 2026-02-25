import * as THREE from 'three';
import { ZHTMLCameraInterface } from '../cameras/ZHTMLCameraInterface';
import { ZHTMLRenderer } from '../render/ZHTMLRenderer';
import { ZHTMLRaycastPixelsResult } from './ZHTMLRaycastPixelsResult';
import { ZHTMLRaycastObjectsResult } from './ZHTMLRaycastObjectsResult';
import { ZHTMLQuad } from '../objects/ZHTMLQuad';
import { ZHTMLObject3D } from '../objects/ZHTMLObject3D';
import { ZHTMLRenderTarget } from '../render/ZHTMLRenderTarget';
import { ZHTMLRenderEventEnableColorPicking } from '../events/ZHTMLRenderEventEnableColorPicking';
import { ZHTMLRenderEventDisableColorPicking } from '../events/ZHTMLRenderEventDisableColorPicking';
import { ZHTMLShaderMaterial } from '../materials/ZHTMLShaderMaterial';

export class ZHTMLRaycast {

	intersectRenderedPixels(options: { quad: ZHTMLQuad, renderer: ZHTMLRenderer, scene: THREE.Scene, camera: THREE.Camera & ZHTMLCameraInterface, renderTarget: ZHTMLRenderTarget, windowX: number, windowY: number }): ZHTMLRaycastPixelsResult | null {

		const renderTarget = options.renderTarget;

		if (renderTarget.bounds.width === 0 || renderTarget.bounds.height === 0) {
			console.warn(`Cannot hit test with a render target that has a width or height of 0. Ensure you have set the render target's layout property to the bounds you wish to render.`, renderTarget.bounds.width, renderTarget.bounds.height);
			return null;
		}

		document.dispatchEvent(new ZHTMLRenderEventEnableColorPicking());

		options.quad.render({
			renderAdapter: options.renderer.renderAdapter,
			scene: options.scene,
			camera: options.camera,
			size: new THREE.Vector2(renderTarget.bounds.width, renderTarget.bounds.height),
		});
		
		document.dispatchEvent(new ZHTMLRenderEventDisableColorPicking());
		
		// Read the pixel color at the mouse position
		const read = options.renderer.renderAdapter.readPixelFromOffscreenTarget({
			target: options.quad.offscreenTarget,
			windowX: options.windowX,
			windowY: options.windowY,
			bounds: renderTarget.bounds,
		});
		
		const pixelTestColor = ZHTMLShaderMaterial.htmlPixelTestColor;
		const hitPixelTest = read[0] === pixelTestColor.r && read[1] === pixelTestColor.g && read[2] === pixelTestColor.b;
		if (!hitPixelTest) {
			return null;
		}

		// If the pixel color is the test color, then the mouse is over an HTML element in the scene (and that part of the
		// HTML element is not occluded by geometry in the scene)
		return {
			renderTarget: renderTarget,
		};

	}

	intersectRenderedObjects(options: { renderer: ZHTMLRenderer, scene: THREE.Scene, camera: THREE.Camera & ZHTMLCameraInterface, renderTarget: ZHTMLRenderTarget, windowX: number, windowY: number }): ZHTMLRaycastObjectsResult[] {

		const renderTarget = options.renderTarget;

		if (renderTarget.bounds.width === 0 || renderTarget.bounds.height === 0) {
			console.warn(`Cannot hit test with a render target that has a width or height of 0. Ensure you have set the render target's layout property to the bounds you wish to render.`, renderTarget.bounds.width, renderTarget.bounds.height);
			return [];
		}

		const objects = options.renderer.getRenderedObjects();
		const raycast = new THREE.Raycaster();
		const mouseCoordinatesInWindow = new THREE.Vector2(options.windowX, options.windowY);
		const mouseCoordinatesInScene = new THREE.Vector2(mouseCoordinatesInWindow.x - renderTarget.bounds.left, mouseCoordinatesInWindow.y - renderTarget.bounds.top);
		const mouseCoordinatesNdc = new THREE.Vector2(
			(mouseCoordinatesInScene.x / renderTarget.bounds.width) * 2 - 1,
			(mouseCoordinatesInScene.y / renderTarget.bounds.height) * -2 + 1
		);
		raycast.setFromCamera(mouseCoordinatesNdc, options.camera);
		const intersections = raycast.intersectObjects(objects, true);
		
		if (intersections.length === 0) {
			return [];
		}

		const results: ZHTMLRaycastObjectsResult[] = intersections.map((intersection) => {
			let htmlObject: ZHTMLObject3D | null = null;
			intersection.object.traverseAncestors((ancestor) => {
				if (ancestor instanceof ZHTMLObject3D) {
					htmlObject = ancestor;
					return;
				}
			});
			const htmlElement = htmlObject ? renderTarget.getElementForObject(htmlObject) : null;
			return {
				html: htmlObject !== null && htmlElement !== null ? {
					object: htmlObject,
					element: htmlElement,
					renderTarget: renderTarget,
				} : null,
				intersection: intersection,
			};
		});

		return results;

	}

}
