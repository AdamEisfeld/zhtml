import * as THREE from 'three';
import { ZHTMLObject3D } from '../objects/ZHTMLObject3D';
import { ZHTMLInternalMaterialEmbed } from '../materials/ZHTMLInternalMaterialEmbed';
import type { ZHTMLRenderSize } from '../utils/ZHTMLRendererUtils';

export type ZHTMLGeometrySolverPlaneConfig = { style: 'explicit', size: ZHTMLRenderSize } | { style: 'implicit' } | { style: 'none'}

export class ZHTMLGeometrySolverPlane {

	object: ZHTMLObject3D;
	config: ZHTMLGeometrySolverPlaneConfig;
	geometry_node: THREE.Mesh;
	_resize_observer: ResizeObserver | null = null;

	constructor(options: { object: ZHTMLObject3D, config: ZHTMLGeometrySolverPlaneConfig }) {

		this.object = options.object;
		this.config = options.config;
		this.geometry_node = new THREE.Mesh();
		this.geometry_node.geometry = new THREE.PlaneGeometry(1, 1);
		this.geometry_node.material = new ZHTMLInternalMaterialEmbed();

		const elements = this.object.getAllElements();

		if (this.config.style === 'explicit') {
			this.geometry_node.scale.set(this.config.size.width, this.config.size.height, 1);
			for (const element of elements) {
				element.style.width = `${this.config.size.width}px`;
				element.style.height = `${this.config.size.height}px`;
			}
		}
		
		if (this.config.style === 'implicit') {
			const monitor_element = elements[0];
			if (!monitor_element) {
				throw new Error('No element provided');
			}
			this._resize_observer = new ResizeObserver(() => {
				this.geometry_node.scale.set(monitor_element.offsetWidth, monitor_element.offsetHeight, 1);
			});
			this._resize_observer.observe(monitor_element);
		}

		if (this.config.style === 'none') {
			this.geometry_node.scale.set(1, 1, 1);
		}

	}

}
