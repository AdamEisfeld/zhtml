import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'stats.js';
import {
	ZHTMLRenderer,
	ZHTMLStereoCamera,
	ZHTMLRenderTarget,
	ZHTMLWebGLRenderAdapter,
	ZHTMLRaycast,
	ZHTMLQuad,
	ZHTMLCameraInterface,
} from 'zhtml';
import { ZHTMLRenderViewStereo } from '@/components/ZHTMLRenderViewStereo';
import { DemoScene } from '../../shared/DemoScene';

const scene = new DemoScene();
const glRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
glRenderer.shadowMap.enabled = true;
glRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
const renderAdapter = new ZHTMLWebGLRenderAdapter(glRenderer);
const renderer = new ZHTMLRenderer({ renderAdapter });

const cameraStereo = new ZHTMLStereoCamera(45, 1, 1, 20000);
cameraStereo.position.set(0, 0, 800);
scene.add(cameraStereo);
const cameraRenderTargetPairs: { camera: THREE.Camera & ZHTMLCameraInterface; renderTarget: ZHTMLRenderTarget }[] = [
	{ camera: cameraStereo.cameraLeft, renderTarget: new ZHTMLRenderTarget({ type: 'embed' }) },
	{ camera: cameraStereo.cameraRight, renderTarget: new ZHTMLRenderTarget({ type: 'embed' }) },
];
const renderTargets = cameraRenderTargetPairs.map((p) => p.renderTarget);

export default function App() {
	const [text, setText] = useState('Hello World!');
	const [scrollOffset, setScrollOffset] = useState(0);
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		scrollContainerRef.current && (scrollContainerRef.current.scrollTop = scrollOffset);
	}, [scrollOffset]);

	useEffect(() => {
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

		const controls = new OrbitControls(cameraStereo, sceneContainerElement);
		controls.enableDamping = true;
		controls.zoomSpeed = 0.3;
		let isOrbitting = false;
		controls.addEventListener('start', () => { isOrbitting = true; });
		controls.addEventListener('end', () => { isOrbitting = false; });

		let mouseX = 0;
		let mouseY = 0;
		const mouseMoveHandler = (event: MouseEvent) => {
			mouseX = event.clientX;
			mouseY = event.clientY;
		};
		window.addEventListener('mousemove', mouseMoveHandler);

		let counter = 0;
		let frameId: number;

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

			controls.update();
			controls.enabled = isOrbitting || !raycastDidHit;

			stats.end();
			frameId = requestAnimationFrame(renderLoop);
		};

		renderLoop();

		return () => {
			window.removeEventListener('mousemove', mouseMoveHandler);
			cancelAnimationFrame(frameId);
			document.body.removeChild(stats.dom);
			glContainer.removeChild(renderer.element);
			controls.dispose();
		};
	}, []);

	return (
		<div className="w-full h-full flex flex-col items-center m-auto gap-8 bg-slate-800">
			<div className="flex flex-col gap-8 m-auto w-full h-full">
				<div
					// @ts-expect-error name is valid for querySelector
					name="scene_container_element"
					className="w-full h-full relative overflow-hidden bg-slate-700"
				>
					<ZHTMLRenderViewStereo
						className="absolute left-0 top-0 w-full h-full"
						leftRenderTarget={renderTargets[0]}
						rightRenderTarget={renderTargets[1]}
						glContainerName="gl_container_element"
					>
						<div
							data-object-uuid={scene.laptop_1.htmlObject.uuid}
							className="hidden"
						>
							<div className="border-4 border-red-300 w-full h-full flex flex-col items-center justify-center gap-4 bg-blue-500 text-white p-4">
								<span className="font-semibold text-xl select-none">HTML Inside WebGL</span>
								<input
									className="w-full h-8 px-4 py-2 rounded-full bg-white text-black font-base"
									type="text"
									placeholder="Write something..."
									value={text}
									onChange={(e) => setText(e.target.value)}
								/>
							</div>
						</div>

						<div
							data-object-uuid={scene.laptop_2.htmlObject.uuid}
							// @ts-expect-error name is valid for querySelector
							name="laptop_2_element"
							className="hidden"
						>
							<div
								ref={scrollContainerRef}
								className="w-full h-full flex flex-col bg-pink-500 text-white overflow-scroll p-4"
								onScroll={(e) => setScrollOffset((e.target as HTMLDivElement).scrollTop)}
							>
								<span className="font-semibold text-xl select-none">Scrollable Content</span>
								<span className="font-base text-sm">
									We will live in this world, which for us has all the disquieting strangeness of the desert and of the simulacrum, with all the veracity of living phantoms, of wandering and simulating animals that capital, that the death of capital has made of us—because the desert of cities is equal to the desert of sand—the jungle of signs is equal to that of the forests—the vertigo of simulacra is equal to that of nature—only the vertiginous seduction of a dying system remains, in which work buries work, in which value buries value—leaving a virgin, sacred space without pathways, continuous as Bataille wished it, where only the wind lifts the sand, where only the wind watches over the sand.
								</span>
							</div>
						</div>

						<div
							data-object-uuid={scene.laptop_3.htmlObject.uuid}
							// @ts-expect-error name is valid for querySelector
							name="laptop_3_element"
							className="hidden"
						>
							<div className="w-full h-full flex flex-col gap-2 bg-lime-500 text-white overflow-scroll p-4">
								<span className="font-base text-lg text-center">
									GIFs Work Too <span className="text-3xl">🎉</span>
								</span>
								<img
									className="rounded-lg w-full h-auto"
									src="https://media4.giphy.com/media/eIm624c8nnNbiG0V3g/giphy.gif?cid=ecf05e47d5ln6mowpnpn8yk89kwsm7qyzm5kmzhx6g4nc1pq&ep=v1_gifs_related&rid=giphy.gif&ct=g"
									alt="Demo GIF"
								/>
							</div>
						</div>
					</ZHTMLRenderViewStereo>
				</div>
			</div>
		</div>
	);
}
