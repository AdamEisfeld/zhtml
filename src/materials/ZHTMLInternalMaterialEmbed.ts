import * as THREE from 'three';
import { ZHTMLShaderMaterial } from './ZHTMLShaderMaterial';

/**
 * This material is applied to the geometry meshs of all ZHTMLObject3D objects that have a render type of 'embed'.
 * We use this material internally to detect if a given pixel belongs to an embed object or not, which can be used to determine
 * if the mouse is over an HTML element in order to enable pointer events with that element's parent container.
 * 
 * We also use this material to "cut a hole" into the final rendered scene so that the HTML elements behind the WebGL canvas can show through.
 * 
 * The show_fill uniform is used to toggle whether or not the material is actually rendered with color. We toggle it on when
 * doing an off-screen pass, then we toggle it back off before rendering the scene to the screen.
 */
export class ZHTMLInternalMaterialEmbed extends ZHTMLShaderMaterial {

	constructor() {
		super({
			vertexShader: /* glsl */`
			
			#include <fog_pars_vertex>
			
			void main() {
				#include <begin_vertex>
				#include <project_vertex>
				#include <fog_vertex>
			}`,
			fragmentShader: /* glsl */`
			
			#include <begin_html>
			#include <fog_pars_fragment>
			
			void main() {
			
				#include <fog_fragment>

				#ifdef USE_HTML

					if (html_pixel_test_enabled > 0) {
						gl_FragColor = vec4(html_pixel_test_color.rgb, 1);
						return;
					}

				#endif

				// Set the fragment color to completely transparent. Because our blending is set to NoBlending, this will cut a hole in the final scene revealing the HTML elements behind the WebGL canvas.
				gl_FragColor = vec4(0, 0, 0, 0);

				#ifdef USE_FOG

					highp float fogMultiplier = 0.0;
					gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
					gl_FragColor = vec4(gl_FragColor.rgb, fogFactor);
					
				#endif
			}
			`,
			uniforms: THREE.UniformsUtils.merge(
				[
					THREE.UniformsLib[ "fog" ],
				]
			),
			side: THREE.DoubleSide,
			blending: THREE.NoBlending,
			transparent: true,
			depthWrite: true,
			fog: true,
		});
	}

}
