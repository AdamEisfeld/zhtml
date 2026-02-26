<script lang="ts">
import { Ref, defineComponent, onMounted, ref } from 'vue';
import * as THREE from 'three';
import Stats from 'stats.js';
import {
	ZHTMLRenderer,
	ZHTMLOrthographicCamera,
	ZHTMLRenderTarget,
	ZHTMLWebGLRenderAdapter,
	ZHTMLRaycast,
	ZHTMLQuad,
	ZHTMLCameraInterface,
} from 'zhtml';
import ZHTMLRenderViewOrtho from '@/components/ZHTMLRenderViewOrtho.vue';
import { DemoScene } from '../../shared/DemoScene';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

export default defineComponent({
	name: 'DemoApplication',
	components: { ZHTMLRenderViewOrtho },
	setup() {
		const showDebugQuad = false;

		let mouseX = 0;
		let mouseY = 0;
		const mouseMoveHandler = (event: MouseEvent) => {
			mouseX = event.clientX;
			mouseY = event.clientY;
		};

		const scene = new DemoScene();

		const glRenderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
		});
		glRenderer.shadowMap.enabled = true;
		glRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

		const renderAdapter = new ZHTMLWebGLRenderAdapter(glRenderer);
		const renderer = new ZHTMLRenderer({ renderAdapter });

		const cameraOrtho = new ZHTMLOrthographicCamera(-1, 1, 1, -1, 1, 20000);
		cameraOrtho.position.set(500, 500, 500);
		cameraOrtho.lookAt(0, 0, 0);
		scene.add(cameraOrtho);
		const cameraRenderTargetPairs: { camera: THREE.Camera & ZHTMLCameraInterface; renderTarget: ZHTMLRenderTarget }[] = [
			{ camera: cameraOrtho, renderTarget: new ZHTMLRenderTarget({ type: 'embed' }) },
		];

		onMounted(() => {
			const sceneContainerElement = document.querySelector('[name="scene_container_element"]') as HTMLDivElement;
			const glContainer = document.querySelector('[name="gl_container_element"]') as HTMLDivElement;
			if (!sceneContainerElement || !glContainer) return;

			const raycastQuad = new ZHTMLQuad({ renderAdapter });
			raycastQuad.quadMaterial.opacity = 0.8;
			const raycast = new ZHTMLRaycast();

			glContainer.appendChild(renderer.element);

			const stats = new Stats();
			stats.showPanel(0);
			document.body.appendChild(stats.dom);

			const controls = new OrbitControls(cameraOrtho, sceneContainerElement);
			controls.enableDamping = true;
			controls.zoomSpeed = 0.3;
			let isOrbitting = false;
			controls.addEventListener('start', () => {
				isOrbitting = true;
			});
			controls.addEventListener('end', () => {
				isOrbitting = false;
			});

			window.addEventListener('mousemove', mouseMoveHandler);

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

				let raycastDidHit = false;

				for (let i = 0; i < cameraRenderTargetPairs.length; i++) {
					const pair = cameraRenderTargetPairs[i];
					pair.camera.htmlNeedsLayout = true;

					const raycastPixels = raycast.intersectRenderedPixels({
						quad: raycastQuad,
						renderer,
						scene,
						camera: pair.camera,
						renderTarget: pair.renderTarget,
						windowX: mouseX,
						windowY: mouseY,
					});
					raycastDidHit = raycastDidHit || raycastPixels !== null;

					renderer.render({
						scene,
						camera: pair.camera,
						renderTarget: pair.renderTarget,
					});

					if (showDebugQuad) {
						pair.camera.showQuad({
							quad: raycastQuad,
							distance: 10,
							width: pair.renderTarget.bounds.width,
							height: pair.renderTarget.bounds.height,
						});
					}
				}

				for (let i = 0; i < cameraRenderTargetPairs.length; i++) {
					const pair = cameraRenderTargetPairs[i];
					if (raycastDidHit) {
						pair.renderTarget.enableInteractions({
							obstructingElements: [renderAdapter.domElement],
						});
					} else {
						pair.renderTarget.disableInteractions({
							obstructingElements: [renderAdapter.domElement],
						});
					}
				}

				controls.enabled = isOrbitting || !raycastDidHit;
				controls.update();

				stats.end();
				requestAnimationFrame(renderLoop);
			};

			renderLoop();
		});

		const text: Ref<string> = ref('Hello World!');
		const onTextChanged = (event: Event) => {
			text.value = (event.target as HTMLInputElement).value;
		};

		const scrollOffset: Ref<number> = ref(0);
		const onScroll = (event: Event) => {
			scrollOffset.value = (event.target as HTMLDivElement).scrollTop;
		};

		const renderTargets = cameraRenderTargetPairs.map((p) => p.renderTarget);

		return {
			text,
			onTextChanged,
			scrollOffset,
			onScroll,
			renderTargets,
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
				<ZHTMLRenderViewOrtho
					class="absolute left-0 top-0 w-full h-full"
					:render-target="renderTargets[0]"
					gl-container-name="gl_container_element"
				>
					<template #content>
						<div
							:data-object-uuid="laptop_1.htmlObject.uuid"
							class="hidden"
						>
							<div class="border-4 border-red-300 w-full h-full flex flex-col items-center justify-center gap-4 bg-blue-500 text-white p-4">
								<span class="font-semibold text-xl select-none">HTML Inside WebGL</span>
								<input
									class="w-full h-8 px-4 py-2 rounded-full bg-white text-black font-base"
									type="text"
									placeholder="Write something..."
									:value="text"
									@input="onTextChanged"
								>
							</div>
						</div>

						<div
							:data-object-uuid="laptop_2.htmlObject.uuid"
							name="laptop_2_element"
							class="hidden"
						>
							<div
								class="w-full h-full flex flex-col bg-pink-500 text-white overflow-scroll p-4"
								:scrollTop="scrollOffset"
								@scroll="onScroll"
							>
								<span class="font-semibold text-xl select-none">Scrollable Content</span>
								<span class="font-base text-sm">
									We will live in this world, which for us has all the disquieting strangeness of the desert and of the simulacrum, with all the veracity of living phantoms, of wandering and simulating animals that capital, that the death of capital has made of us—because the desert of cities is equal to the desert of sand—the jungle of signs is equal to that of the forests—the vertigo of simulacra is equal to that of nature—only the vertiginous seduction of a dying system remains, in which work buries work, in which value buries value—leaving a virgin, sacred space without pathways, continuous as Bataille wished it, where only the wind lifts the sand, where only the wind watches over the sand.
								</span>
							</div>
						</div>

						<div
							:data-object-uuid="laptop_3.htmlObject.uuid"
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
				</ZHTMLRenderViewOrtho>
			</div>
		</div>
	</div>
</template>
