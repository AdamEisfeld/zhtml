import * as THREE from 'three';
import { DemoLaptop } from './DemoLaptop';

export class DemoScene extends THREE.Scene {
	laptop_1: DemoLaptop;
	laptop_2: DemoLaptop;
	laptop_3: DemoLaptop;
	groundplane: THREE.Mesh;
	light_1: THREE.PointLight;
	light_2: THREE.PointLight;

	constructor() {
		super();

		const laptop_1 = new DemoLaptop();
		laptop_1.position.set(0, 0, 0);
		laptop_1.rotation.set(0, 0, 0);
		this.add(laptop_1);

		const laptop_2 = new DemoLaptop();
		laptop_2.position.set(300, 100, -400);
		laptop_2.rotation.set(0, -0.4, 0);
		this.add(laptop_2);

		const laptop_3 = new DemoLaptop();
		laptop_3.position.set(-300, 200, -400);
		laptop_3.rotation.set(0, 0.4, 0);
		const laptop_3_box_geometry = new THREE.BoxGeometry(400, 100, 300);
		const laptop_3_box_material = new THREE.MeshPhongMaterial({
			map: new THREE.TextureLoader().load(new URL('/textures/marble.jpeg', import.meta.url).href),
			shininess: 100,
			specular: 0x111111,
		});
		const laptop_3_box = new THREE.Mesh(laptop_3_box_geometry, laptop_3_box_material);
		laptop_3_box.position.set(0, -170, 100);
		laptop_3_box.castShadow = true;
		laptop_3_box.receiveShadow = true;
		laptop_2.add(laptop_3_box);
		this.add(laptop_3);

		const ground_plane = new THREE.Mesh(
			new THREE.PlaneGeometry(5000, 5000),
			new THREE.MeshPhongMaterial({
				map: new THREE.TextureLoader().load(new URL('/textures/wood_1.jpeg', import.meta.url).href),
				depthWrite: false,
				shininess: 100,
				specular: 0x111111,
			})
		);
		ground_plane.rotation.x = -Math.PI / 2;
		ground_plane.position.y = -120;
		ground_plane.receiveShadow = true;
		this.add(ground_plane);

		const light_1 = new THREE.PointLight('white', 2, 3000, 0.001);
		light_1.position.set(0, 300, -500);
		this.add(light_1);

		const light_2 = new THREE.PointLight('white', 2, 1000, 0.0001);
		light_2.position.set(100, 100, 200);
		light_2.castShadow = true;
		this.add(light_2);
		const light_2_sphere = new THREE.Mesh(
			new THREE.SphereGeometry(10, 32, 32),
			new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false })
		);
		light_2.add(light_2_sphere);

		this.laptop_1 = laptop_1;
		this.laptop_2 = laptop_2;
		this.laptop_3 = laptop_3;
		this.groundplane = ground_plane;
		this.light_1 = light_1;
		this.light_2 = light_2;
		this.fog = new THREE.Fog('#334155', 1, 4001);
	}
}
