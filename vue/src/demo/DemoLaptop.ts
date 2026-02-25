import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HTMLObject3D, HTMLMaterialPhong, HTMLGeometrySolverPlane } from 'zhtml';

export class DemoLaptop extends THREE.Object3D {
  html_object: HTMLObject3D;
  html_effect_material: HTMLMaterialPhong;

  constructor() {
    super();

    this.html_effect_material = new HTMLMaterialPhong();
    this.html_effect_material.shininess = 30;
    this.html_effect_material.roughness = 0.5;
    this.html_object = new HTMLObject3D({});

    let laptop_body: THREE.Object3D | undefined;

    const loader = new GLTFLoader();

    loader.load(new URL('/models/laptop_body.gltf', import.meta.url).href, (gltf) => {
      gltf.scene.traverse(function (child) {
        const child_as_mesh = child as THREE.Mesh;
        if (!child_as_mesh.material) return;
        if (Array.isArray(child_as_mesh.material)) {
          for (let i = 0; i < child_as_mesh.material.length; i++) {
            const material = child_as_mesh.material[i];
            material.side = THREE.FrontSide;
          }
        } else {
          child_as_mesh.material.side = THREE.FrontSide;
        }
        child_as_mesh.castShadow = true;
        child_as_mesh.receiveShadow = true;
      });

      laptop_body = gltf.scene;
      laptop_body.scale.set(100, 100, 100);
      this.add(laptop_body);
    }, undefined, (error) => {
      console.error('Failed to load laptop body:', error);
    });

    loader.load(new URL('/models/laptop_screen.gltf', import.meta.url).href, (gltf) => {
      if (!laptop_body) return;

      const laptop_screen_box = new THREE.Box3().setFromObject(gltf.scene);
      const laptop_screen_size = laptop_screen_box.getSize(new THREE.Vector3());

      const geometry_solver = new HTMLGeometrySolverPlane({
        object: this.html_object,
        config: {
          style: 'explicit',
          size: {
            width: laptop_screen_size.x * 100,
            height: laptop_screen_size.y * 100,
          },
        },
      });

      const effect_node = new THREE.Mesh();
      effect_node.geometry = new THREE.PlaneGeometry(1, 1);
      effect_node.material = this.html_effect_material;
      effect_node.scale.set(laptop_screen_size.x * 100, laptop_screen_size.y * 100, 1);
      effect_node.position.z = 1;
      this.html_object.add(effect_node);

      this.html_object.html_geometry_node = geometry_solver.geometry_node;
      if (this.html_object.html_geometry_node) {
        this.html_object.html_geometry_node.castShadow = true;
      }

      this.add(this.html_object);
    }, undefined, (error) => {
      console.error('Failed to load laptop screen:', error);
    });
  }

  updateLayout() {
    this.html_object.html_needs_layout = true;
  }
}
