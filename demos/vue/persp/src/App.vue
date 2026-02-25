<script lang="ts">
import { Ref, defineComponent, onMounted, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'stats.js';
import {
	ZHTMLRenderer,
	ZHTMLPerspectiveCamera,
	ZHTMLRenderTarget,
	ZHTMLWebGLRenderAdapter,
	ZHTMLRaycast,
	ZHTMLQuad,
	ZHTMLCameraInterface,
} from 'zhtml';
import ZHTMLRenderViewPersp from '@/components/ZHTMLRenderViewPersp.vue';
import { DemoScene } from '../../shared/DemoScene';

export default defineComponent({
	name: 'DemoApplication',
	components: { ZHTMLRenderViewPersp },
	setup() {
		const show_debug_quad = false;

		let mouse_x = 0;
		let mouse_y = 0;
		const mouse_move_handler = (event: MouseEvent) => {
			mouse_x = event.clientX;
			mouse_y = event.clientY;
		};

		const scene = new DemoScene();

		const gl_renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
		});
		gl_renderer.shadowMap.enabled = true;
		gl_renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		const render_adapter = new ZHTMLWebGLRenderAdapter(gl_renderer);
		const renderer = new ZHTMLRenderer({ render_adapter });

		const camera_persp = new ZHTMLPerspectiveCamera(35, 1, 1, 20000);
		camera_persp.position.set(0, 0, 1000);
		scene.add(camera_persp);
		const camera_render_target_pairs: { camera: THREE.Camera & ZHTMLCameraInterface; render_target: ZHTMLRenderTarget }[] = [
			{ camera: camera_persp, render_target: new ZHTMLRenderTarget({ type: 'embed' }) },
		];

		onMounted(() => {
			const scene_container_element = document.querySelector('[name="scene_container_element"]') as HTMLDivElement;
			const gl_container = document.querySelector('[name="gl_container_element"]') as HTMLDivElement;
			if (!scene_container_element || !gl_container) return;

			const raycast_quad = new ZHTMLQuad({ render_adapter });
			raycast_quad.quad_material.opacity = 0.8;
			const raycast = new ZHTMLRaycast();

			gl_container.appendChild(renderer.element);

			const stats = new Stats();
			stats.showPanel(0);
			document.body.appendChild(stats.dom);

			const controls = new OrbitControls(camera_persp, scene_container_element);
			controls.enableDamping = true;
			controls.zoomSpeed = 0.3;
			let is_orbitting = false;
			controls.addEventListener('start', () => { is_orbitting = true; });
			controls.addEventListener('end', () => { is_orbitting = false; });

			window.addEventListener('mousemove', mouse_move_handler);

			let counter = 0;

			const renderLoop = () => {
				stats.begin();

				scene.laptop_3.rotation.y = Math.sin(counter);
				scene.laptop_3.position.y = 200 + Math.sin(counter) * 100;
				scene.light_2.position.x = Math.sin(counter) * 100;
				counter += 0.01;

				scene.laptop_1.updateLayout();
				scene.laptop_2.updateLayout();
				scene.laptop_3.updateLayout();

				let raycast_did_hit = false;

				for (let i = 0; i < camera_render_target_pairs.length; i++) {
					const pair = camera_render_target_pairs[i];
					pair.camera.html_needs_layout = true;

					const raycast_pixels = raycast.intersectRenderedPixels({
						quad: raycast_quad,
						renderer,
						scene,
						camera: pair.camera,
						render_target: pair.render_target,
						window_x: mouse_x,
						window_y: mouse_y,
					});
					raycast_did_hit = raycast_did_hit || raycast_pixels !== null;

					renderer.render({
						scene,
						camera: pair.camera,
						render_target: pair.render_target,
					});

					if (show_debug_quad) {
						pair.camera.showQuad({
							quad: raycast_quad,
							distance: 10,
							width: pair.render_target.bounds.width,
							height: pair.render_target.bounds.height,
						});
					}
				}

				for (let i = 0; i < camera_render_target_pairs.length; i++) {
					const pair = camera_render_target_pairs[i];
					if (raycast_did_hit) {
						pair.render_target.enableInteractions({
							obstructing_elements: [render_adapter.domElement],
						});
					} else {
						pair.render_target.disableInteractions({
							obstructing_elements: [render_adapter.domElement],
						});
					}
				}

				controls.update();
				controls.enabled = is_orbitting || !raycast_did_hit;

				stats.end();
				requestAnimationFrame(renderLoop);
			};

			renderLoop();
		});

		const text: Ref<string> = ref('Hello World!');
		const on_text_changed = (event: Event) => {
			text.value = (event.target as HTMLInputElement).value;
		};

		const scroll_offset: Ref<number> = ref(0);
		const on_scroll = (event: Event) => {
			scroll_offset.value = (event.target as HTMLDivElement).scrollTop;
		};

		const render_targets = camera_render_target_pairs.map((p) => p.render_target);

		return {
			text,
			on_text_changed,
			scroll_offset,
			on_scroll,
			render_targets,
			laptop_1: scene.laptop_1,
			laptop_2: scene.laptop_2,
			laptop_3: scene.laptop_3,
		};
	},
});
</script>

<template>
	<div class="w-full h-full flex flex-col items-center m-auto gap-8 bg-slate-800">
		<div class="flex flex-col gap-8 m-auto w-full h-full">
			<div
				name="scene_container_element"
				class="w-full h-full relative overflow-hidden bg-slate-700"
			>
				<ZHTMLRenderViewPersp
					class="absolute left-0 top-0 w-full h-full"
					:render_target="render_targets[0]"
					gl_container_name="gl_container_element"
				>
					<template #content>
						<div
							:data-object-uuid="laptop_1.html_object.uuid"
							class="hidden"
						>
							<div class="border-4 border-red-300 w-full h-full flex flex-col items-center justify-center gap-4 bg-blue-500 text-white p-4">
								<span class="font-semibold text-xl select-none">HTML Inside WebGL</span>
								<input
									class="w-full h-8 px-4 py-2 rounded-full bg-white text-black font-base"
									type="text"
									placeholder="Write something..."
									:value="text"
									@input="on_text_changed"
								>
							</div>
						</div>

						<div
							:data-object-uuid="laptop_2.html_object.uuid"
							name="laptop_2_element"
							class="hidden"
						>
							<div
								class="w-full h-full flex flex-col bg-pink-500 text-white overflow-scroll p-4"
								:scroll-top="scroll_offset"
								@scroll="on_scroll"
							>
								<span class="font-semibold text-xl select-none">Scrollable Content</span>
								<span class="font-base text-sm">
									We will live in this world, which for us has all the disquieting strangeness of the desert and of the simulacrum, with all the veracity of living phantoms, of wandering and simulating animals that capital, that the death of capital has made of us—because the desert of cities is equal to the desert of sand—the jungle of signs is equal to that of the forests—the vertigo of simulacra is equal to that of nature—only the vertiginous seduction of a dying system remains, in which work buries work, in which value buries value—leaving a virgin, sacred space without pathways, continuous as Bataille wished it, where only the wind lifts the sand, where only the wind watches over the sand.
								</span>
							</div>
						</div>

						<div
							:data-object-uuid="laptop_3.html_object.uuid"
							name="laptop_3_element"
							class="hidden"
						>
							<div class="w-full h-full flex flex-col gap-2 bg-lime-500 text-white overflow-scroll p-4">
								<span class="font-base text-lg text-center">
									GIFs Work Too <span class="text-3xl">🎉</span>
								</span>
								<img
									class="rounded-lg w-full h-auto"
									src="https://media4.giphy.com/media/eIm624c8nnNbiG0V3g/giphy.gif?cid=ecf05e47d5ln6mowpnpn8yk89kwsm7qyzm5kmzhx6g4nc1pq&ep=v1_gifs_related&rid=giphy.gif&ct=g"
									alt="Demo GIF"
								>
							</div>
						</div>
					</template>
				</ZHTMLRenderViewPersp>
			</div>
		</div>
	</div>
</template>
