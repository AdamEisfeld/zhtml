import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
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
import { DemoScene } from '../../shared/DemoScene';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

const showDebugQuad = false;

export default function App() {
	const [text, setText] = useState('Hello World!');
	const [scrollOffset, setScrollOffset] = useState(0);
	const leftScrollRef = useRef<HTMLDivElement>(null);
	const rightScrollRef = useRef<HTMLDivElement>(null);

	const [screenSize, setScreenSize] = useState<{ x: number; y: number } | undefined>(undefined);

	const sceneContainerRef = useRef<HTMLDivElement>(null);
	const leftSceneRef = useRef<HTMLDivElement>(null);
	const leftCameraRef = useRef<HTMLDivElement>(null);
	const rightSceneRef = useRef<HTMLDivElement>(null);
	const rightCameraRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const leftLaptop1Ref = useRef<HTMLDivElement>(null);
	const leftLaptop2Ref = useRef<HTMLDivElement>(null);
	const leftLaptop3Ref = useRef<HTMLDivElement>(null);
	const rightLaptop1Ref = useRef<HTMLDivElement>(null);
	const rightLaptop2Ref = useRef<HTMLDivElement>(null);
	const rightLaptop3Ref = useRef<HTMLDivElement>(null);

	const [scene] = useState(() => new DemoScene({
		onReady: (sceneData) => setScreenSize(sceneData.screenSize),
	}));

	const [cameraStereo] = useState(() => {
		const c = new ZHTMLStereoCamera(45, 1, 1, 20000);
		c.position.set(0, 0, 800);
		c.eyeSeparation = 100;
		scene.add(c);
		return c;
	});

	useEffect(() => {
		leftScrollRef.current && (leftScrollRef.current.scrollTop = scrollOffset);
		rightScrollRef.current && (rightScrollRef.current.scrollTop = scrollOffset);
	}, [scrollOffset]);

	useEffect(() => {
		const sceneContainerElement = sceneContainerRef.current;
		const leftSceneElement = leftSceneRef.current;
		const leftCameraElement = leftCameraRef.current;
		const rightSceneElement = rightSceneRef.current;
		const rightCameraElement = rightCameraRef.current;
		const canvas = canvasRef.current;
		const leftLaptop1 = leftLaptop1Ref.current;
		const leftLaptop2 = leftLaptop2Ref.current;
		const leftLaptop3 = leftLaptop3Ref.current;
		const rightLaptop1 = rightLaptop1Ref.current;
		const rightLaptop2 = rightLaptop2Ref.current;
		const rightLaptop3 = rightLaptop3Ref.current;

		if (!sceneContainerElement || !leftSceneElement || !leftCameraElement ||
			!rightSceneElement || !rightCameraElement || !canvas ||
			!leftLaptop1 || !leftLaptop2 || !leftLaptop3 ||
			!rightLaptop1 || !rightLaptop2 || !rightLaptop3) return;

		const glRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas });
		glRenderer.shadowMap.enabled = true;
		glRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
		const renderAdapter = new ZHTMLWebGLRenderAdapter(glRenderer);

		const leftRenderTarget = new ZHTMLRenderTarget({
			sceneElement: leftSceneElement,
			cameraElement: leftCameraElement,
		});

		leftRenderTarget.registerElementForObject(scene.laptop_1.htmlObject, leftLaptop1);
		leftRenderTarget.registerElementForObject(scene.laptop_2.htmlObject, leftLaptop2);
		leftRenderTarget.registerElementForObject(scene.laptop_3.htmlObject, leftLaptop3);

		const rightRenderTarget = new ZHTMLRenderTarget({
			sceneElement: rightSceneElement,
			cameraElement: rightCameraElement,
		});

		rightRenderTarget.registerElementForObject(scene.laptop_1.htmlObject, rightLaptop1);
		rightRenderTarget.registerElementForObject(scene.laptop_2.htmlObject, rightLaptop2);
		rightRenderTarget.registerElementForObject(scene.laptop_3.htmlObject, rightLaptop3);

		const cameraRenderTargetPairs: { camera: THREE.Camera & ZHTMLCameraInterface; renderTarget: ZHTMLRenderTarget }[] = [
			{ camera: cameraStereo.cameraLeft, renderTarget: leftRenderTarget },
			{ camera: cameraStereo.cameraRight, renderTarget: rightRenderTarget },
		];

		const htmlRenderer = new ZHTMLRenderer({
			renderAdapter,
			canvas,
		});

		const raycastQuad = new ZHTMLQuad({ renderAdapter });
		raycastQuad.quadMaterial.opacity = 0.8;
		const raycast = new ZHTMLRaycast();

		const stats = new Stats();
		stats.showPanel(0);
		document.body.appendChild(stats.dom);

		const controls = new OrbitControls(cameraStereo, sceneContainerElement);
		controls.enableDamping = true;
		controls.zoomSpeed = 0.3;
		let isOrbitting = false;
		controls.addEventListener('start', () => {
			isOrbitting = true;
		});
		controls.addEventListener('end', () => {
			isOrbitting = false;
		});

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
					renderer: htmlRenderer,
					scene,
					camera: pair.camera,
					renderTarget: pair.renderTarget,
					windowX: mouseX,
					windowY: mouseY,
				});
				raycastDidHit = raycastDidHit || raycastPixels !== null;

				htmlRenderer.render({
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

			controls.enabled = isOrbitting || !raycastDidHit;
			controls.update();

			stats.end();
			frameId = requestAnimationFrame(renderLoop);
		};

		renderLoop();

		return () => {
			window.removeEventListener('mousemove', mouseMoveHandler);
			cancelAnimationFrame(frameId);
			document.body.removeChild(stats.dom);
			controls.dispose();
			htmlRenderer.dispose();
		};
	}, [scene, cameraStereo]);

	return (
		<div className="w-full h-full flex flex-col items-center m-auto gap-8 bg-slate-800">
			<div className="flex flex-col gap-8 w-full h-full">
				<div
					ref={sceneContainerRef}
					className="w-full h-full relative overflow-hidden bg-slate-700"
				>
					{/* Left eye: scene + camera */}
					<div
						ref={leftSceneRef}
						className="absolute left-0 top-0 w-1/2 h-full"
					>
						<div
							ref={leftCameraRef}
							className="pointer-events-none user-select-none absolute top-0 left-0 w-full h-full"
						>
							<div ref={leftLaptop1Ref} style={screenSize ? { width: screenSize.x, height: screenSize.y } : undefined} className="hidden">
								<div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-blue-500 text-white p-4 pointer-events-auto user-select-auto">
									<span className="font-semibold text-xl select-none">HTML Inside WebGL</span>
									<input className="w-full h-8 px-4 py-2 rounded-full bg-white text-black font-base" type="text" placeholder="Write something..." value={text} onChange={(e) => setText(e.target.value)} />
								</div>
							</div>
							<div ref={leftLaptop2Ref} style={screenSize ? { width: screenSize.x, height: screenSize.y } : undefined} className="hidden">
								<div ref={leftScrollRef} className="w-full h-full flex flex-col bg-pink-500 text-white overflow-scroll p-4 pointer-events-auto user-select-auto" onScroll={(e) => setScrollOffset((e.target as HTMLDivElement).scrollTop)}>
									<span className="font-semibold text-xl select-none">Scrollable Content</span>
									<span className="font-base text-sm">We will live in this world, which for us has all the disquieting strangeness of the desert and of the simulacrum, with all the veracity of living phantoms, of wandering and simulating animals that capital, that the death of capital has made of us—because the desert of cities is equal to the desert of sand—the jungle of signs is equal to that of the forests—the vertigo of simulacra is equal to that of nature—only the vertiginous seduction of a dying system remains, in which work buries work, in which value buries value—leaving a virgin, sacred space without pathways, continuous as Bataille wished it, where only the wind lifts the sand, where only the wind watches over the sand.</span>
								</div>
							</div>
							<div ref={leftLaptop3Ref} style={screenSize ? { width: screenSize.x, height: screenSize.y } : undefined} className="hidden">
								<div className="w-full h-full flex flex-col gap-2 bg-lime-500 text-white overflow-scroll p-4 pointer-events-auto user-select-auto">
									<span className="font-base text-lg text-center">GIFs Work Too <span className="text-3xl">🎉</span></span>
									<img className="rounded-lg w-full h-auto" src="https://media4.giphy.com/media/eIm624c8nnNbiG0V3g/giphy.gif?cid=ecf05e47d5ln6mowpnpn8yk89kwsm7qyzm5kmzhx6g4nc1pq&ep=v1_gifs_related&rid=giphy.gif&ct=g" alt="Demo GIF" />
								</div>
							</div>
						</div>
					</div>

					{/* Right eye: scene + camera */}
					<div
						ref={rightSceneRef}
						className="absolute right-0 top-0 w-1/2 h-full"
					>
						<div
							ref={rightCameraRef}
							className="pointer-events-none user-select-none absolute top-0 left-0 w-full h-full"
						>
							<div ref={rightLaptop1Ref} style={screenSize ? { width: screenSize.x, height: screenSize.y } : undefined} className="hidden">
								<div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-blue-500 text-white p-4 pointer-events-auto user-select-auto">
									<span className="font-semibold text-xl select-none">HTML Inside WebGL</span>
									<input className="w-full h-8 px-4 py-2 rounded-full bg-white text-black font-base" type="text" placeholder="Write something..." value={text} onChange={(e) => setText(e.target.value)} />
								</div>
							</div>
							<div ref={rightLaptop2Ref} style={screenSize ? { width: screenSize.x, height: screenSize.y } : undefined} className="hidden">
								<div ref={rightScrollRef} className="w-full h-full flex flex-col bg-pink-500 text-white overflow-scroll p-4 pointer-events-auto user-select-auto" onScroll={(e) => setScrollOffset((e.target as HTMLDivElement).scrollTop)}>
									<span className="font-semibold text-xl select-none">Scrollable Content</span>
									<span className="font-base text-sm">We will live in this world, which for us has all the disquieting strangeness of the desert and of the simulacrum, with all the veracity of living phantoms, of wandering and simulating animals that capital, that the death of capital has made of us—because the desert of cities is equal to the desert of sand—the jungle of signs is equal to that of the forests—the vertigo of simulacra is equal to that of nature—only the vertiginous seduction of a dying system remains, in which work buries work, in which value buries value—leaving a virgin, sacred space without pathways, continuous as Bataille wished it, where only the wind lifts the sand, where only the wind watches over the sand.</span>
								</div>
							</div>
							<div ref={rightLaptop3Ref} style={screenSize ? { width: screenSize.x, height: screenSize.y } : undefined} className="hidden">
								<div className="w-full h-full flex flex-col gap-2 bg-lime-500 text-white overflow-scroll p-4 pointer-events-auto user-select-auto">
									<span className="font-base text-lg text-center">GIFs Work Too <span className="text-3xl">🎉</span></span>
									<img className="rounded-lg w-full h-auto" src="https://media4.giphy.com/media/eIm624c8nnNbiG0V3g/giphy.gif?cid=ecf05e47d5ln6mowpnpn8yk89kwsm7qyzm5kmzhx6g4nc1pq&ep=v1_gifs_related&rid=giphy.gif&ct=g" alt="Demo GIF" />
								</div>
							</div>
						</div>
					</div>

					{/* Canvas: defined in template, passed to WebGLRenderer */}
					<canvas
						ref={canvasRef}
						className="absolute inset-0 w-full h-full block pointer-events-none user-select-none"
					/>

					{/* Loading */}
					{screenSize === undefined && (
						<div className="absolute inset-0 bg-black flex items-center justify-center">
							Loading...
						</div>
					)}
				</div>

				
			</div>
		</div>
	);
}
