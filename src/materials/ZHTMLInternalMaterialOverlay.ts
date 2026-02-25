import * as THREE from 'three';
import { ZHTMLShaderMaterial } from './ZHTMLShaderMaterial';

/**
 * This material is applied to the geometry meshs of all ZHTMLObject3D objects that have a render type of 'overlay'.
 * We use this material internally to detect if a given pixel belongs to an overlay object or not, which can be used to determine
 * if the mouse is over an HTML element in order to enable pointer events with that element's parent container.
 * 
 * The show_fill uniform is used to toggle whether or not the material is actually rendered with color. We toggle it on when
 * doing an off-screen pass, then we toggle it back off before rendering the scene to the screen.
 */
export class ZHTMLInternalMaterialOverlay extends ZHTMLShaderMaterial {

	constructor() {
		super({
			vertexShader: /* glsl */`
			
			#include <fog_pars_vertex>
			
			void main() {
				#include <begin_vertex>
				#include <project_vertex>
			}`,
			fragmentShader: /* glsl */`
			
			#include <begin_html>
			
			void main() {

				#ifdef USE_HTML

					if (html_pixel_test_enabled > 0) {
						gl_FragColor = vec4(html_pixel_test_color.rgb, 1);
						return;
					}

				#endif

				// Set the fragment color to completely transparent, this is an overlay so we won't show it at all
				gl_FragColor = vec4(0, 0, 0, 0);
			}
			`,
			uniforms: {},
			side: THREE.DoubleSide,
			transparent: true,
			depthWrite: false,
			depthTest: false,
			colorWrite: true,
		});
	}

}
