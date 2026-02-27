import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ZHTMLObject3D, ZHTMLMaterialPhong, ZHTMLGeometrySolverPlane } from 'zhtml';

export class DemoLaptop extends THREE.Object3D {
	htmlObject: ZHTMLObject3D;
	htmlEffectMaterial: ZHTMLMaterialPhong;

	constructor() {
		super();

		this.htmlEffectMaterial = new ZHTMLMaterialPhong();
		this.htmlEffectMaterial.shininess = 30;
		this.htmlEffectMaterial.roughness = 0.5;
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
			if (!laptopBody) return;

			const laptopScreenBox = new THREE.Box3().setFromObject(gltf.scene);
			const laptopScreenSize = laptopScreenBox.getSize(new THREE.Vector3());

			const geometrySolver = new ZHTMLGeometrySolverPlane({
				object: this.htmlObject,
				mode: 'embed',
				config: {
					style: 'explicit',
					size: {
						width: laptopScreenSize.x * 100,
						height: laptopScreenSize.y * 100,
					},
				},
			});

			const effectNode = new THREE.Mesh();
			effectNode.geometry = new THREE.PlaneGeometry(1, 1);
			effectNode.material = this.htmlEffectMaterial;
			effectNode.scale.set(laptopScreenSize.x * 100, laptopScreenSize.y * 100, 1);
			effectNode.position.z = 1;
			this.htmlObject.add(effectNode);

			this.htmlObject.htmlGeometryNode = geometrySolver.geometryNode;
			if (this.htmlObject.htmlGeometryNode) {
				this.htmlObject.htmlGeometryNode.castShadow = true;
			}

			this.add(this.htmlObject);
		}, undefined, (error) => {
			console.error('Failed to load laptop screen:', error);
		});
	}

	updateLayout() {
		this.htmlObject.htmlNeedsLayout = true;
	}
}
