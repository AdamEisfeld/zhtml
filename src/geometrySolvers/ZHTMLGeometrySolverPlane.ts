import * as THREE from 'three';
import { ZHTMLObject3D } from '../objects/ZHTMLObject3D';
import { ZHTMLInternalMaterialEmbed } from '../materials/ZHTMLInternalMaterialEmbed';
import type { ZHTMLRenderSize } from '../utils/ZHTMLRendererUtils';

export type ZHTMLGeometrySolverPlaneConfig = { style: 'explicit', size: ZHTMLRenderSize } | { style: 'implicit' } | { style: 'none'}

export class ZHTMLGeometrySolverPlane {

	object: ZHTMLObject3D;
	config: ZHTMLGeometrySolverPlaneConfig;
	geometryNode: THREE.Mesh;
	private _resizeObserver: ResizeObserver | null = null;

	constructor(options: { object: ZHTMLObject3D, config: ZHTMLGeometrySolverPlaneConfig }) {

		this.object = options.object;
		this.config = options.config;
		this.geometryNode = new THREE.Mesh();
		this.geometryNode.geometry = new THREE.PlaneGeometry(1, 1);
		this.geometryNode.material = new ZHTMLInternalMaterialEmbed();

		const elements = this.object.getAllElements();

		if (this.config.style === 'explicit') {
			this.geometryNode.scale.set(this.config.size.width, this.config.size.height, 1);
			for (const element of elements) {
				element.style.width = `${this.config.size.width}px`;
				element.style.height = `${this.config.size.height}px`;
			}
		}
		
		if (this.config.style === 'implicit') {
			const monitorElement = elements[0];
			if (!monitorElement) {
				throw new Error('No element provided');
			}
			this._resizeObserver = new ResizeObserver(() => {
				this.geometryNode.scale.set(monitorElement.offsetWidth, monitorElement.offsetHeight, 1);
			});
			this._resizeObserver.observe(monitorElement);
		}

		if (this.config.style === 'none') {
			this.geometryNode.scale.set(1, 1, 1);
		}

	}

}
