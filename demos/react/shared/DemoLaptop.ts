import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ZHTMLObject3D, ZHTMLMaterialPhong, ZHTMLInternalMaterialEmbed } from 'zhtml';

export interface DemoLaptopReady {
	screenSize: { x: number; y: number };
}

export interface DemoLaptopOptions {
	onReady?: (ready: DemoLaptopReady) => void;
}

export class DemoLaptop extends THREE.Object3D {

	htmlObject: ZHTMLObject3D;

	screenSize: THREE.Vector2 = new THREE.Vector2(0, 0);

	constructor(options?: DemoLaptopOptions) {
		super();

		this.htmlObject = new ZHTMLObject3D({});

		let laptopBody: THREE.Object3D | undefined;

		const loader = new GLTFLoader();

		loader.load(new URL('/models/laptop_body.gltf', import.meta.url).href, (gltf) => {
			gltf.scene.traverse(function (child) {
				const childAsMesh = child as THREE.Mesh;
				if (!childAsMesh.material) return;
				if (Array.isArray(childAsMesh.material)) {
					for (let i = 0; i < childAsMesh.material.length; i++) {
						const material = childAsMesh.material[i];
						material.side = THREE.FrontSide;
					}
				} else {
					childAsMesh.material.side = THREE.FrontSide;
				}
				childAsMesh.castShadow = true;
				childAsMesh.receiveShadow = true;
			});

			laptopBody = gltf.scene;
			laptopBody.scale.set(100, 100, 100);
			this.add(laptopBody);
		}, undefined, (error) => {
			console.error('Failed to load laptop body:', error);
		});

		loader.load(new URL('/models/laptop_screen.gltf', import.meta.url).href, (gltf) => {
			const laptopScreenBox = new THREE.Box3().setFromObject(gltf.scene);
			const laptopScreenSize = laptopScreenBox.getSize(new THREE.Vector3());

			const width = laptopScreenSize.x * 100;
			const height = laptopScreenSize.y * 100;

			const geometryNode = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new ZHTMLInternalMaterialEmbed());
			geometryNode.scale.set(width, height, 1);
			geometryNode.castShadow = true;

			const effectNode = new THREE.Mesh();
			effectNode.geometry = new THREE.PlaneGeometry(1, 1);
			const effectMaterial = new ZHTMLMaterialPhong();
			effectMaterial.shininess = 30;
			effectMaterial.roughness = 0.5;
			effectNode.material = effectMaterial;
			effectNode.scale.set(width, height, 1);
			effectNode.position.z = 1;
			this.htmlObject.add(effectNode);

			this.htmlObject.htmlGeometryNode = geometryNode;

			this.screenSize.set(width, height);
			options?.onReady?.({ screenSize: { x: width, y: height } });

			this.add(this.htmlObject);
		}, undefined, (error) => {
			console.error('Failed to load laptop screen:', error);
		});

	}

	updateLayout() {
		this.htmlObject.htmlNeedsLayout = true;
	}
}
