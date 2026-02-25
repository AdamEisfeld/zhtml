import * as THREE from 'three';
import { FileShaderMaterial, FileShaderMaterialParameters } from './FileShaderMaterial';
import { HTMLRenderEventEnableColorPicking } from '../events/HTMLRenderEventEnableColorPicking';
import { HTMLRenderEventDisableColorPicking } from '../events/HTMLRenderEventDisableColorPicking';

import begin_html from './begin_html.glsl';

export const HTMLShaderChunk: Record<string, string> = {
	begin_html: begin_html,
};

export class HTMLShaderMaterial extends FileShaderMaterial {

	static readonly HTML_PIXEL_TEST_COLOR = new THREE.Color(1.0, 0.5, 1.0);

	set html_pixel_test_enabled(value: boolean) {
		this.uniforms.html_pixel_test_enabled.value = value ? 1 : 0;
	}

	get html_pixel_test_enabled(): boolean {
		return this.uniforms.html_pixel_test_enabled.value === 1;
	}
	
	set html_pixel_test_color(value: THREE.Color) {
		this.uniforms.html_pixel_test_color.value = value;
	}

	get html_pixel_test_color(): THREE.Color {
		return this.uniforms.html_pixel_test_color.value;
	}

	private _onEnableColorPickingBind: (event: HTMLRenderEventEnableColorPicking) => void;
	private _onDisableColorPickingBind: (event: HTMLRenderEventDisableColorPicking) => void;

	constructor(parameters?: FileShaderMaterialParameters) {

		const mutable_parameters = parameters || {};

		// Inject required file chunks that users can reference in their HTML material subclasses
		const mutable_file_chunks = mutable_parameters.file_chunks || [];
		mutable_file_chunks.push(HTMLShaderChunk);
		mutable_parameters.file_chunks = mutable_file_chunks;

		// Inject required uniforms for HTML rendering
		const mutable_uniforms = mutable_parameters.uniforms || {};
		mutable_uniforms.html_pixel_test_enabled = { value: 0 };
		mutable_uniforms.html_pixel_test_color = { value: HTMLShaderMaterial.HTML_PIXEL_TEST_COLOR };
		mutable_parameters.uniforms = mutable_uniforms;
		
		super(mutable_parameters);

		// Bind HTMLRenderEventEnableColorPicking to onEnableColorPicking
		this._onEnableColorPickingBind = this.onEnableColorPicking.bind(this);
		document.addEventListener(HTMLRenderEventEnableColorPicking.event_name, this._onEnableColorPickingBind);
		
		// Bind HTMLRenderEventDisableColorPicking to onDisableColorPicking
		this._onDisableColorPickingBind = this.onDisableColorPicking.bind(this);
		document.addEventListener(HTMLRenderEventDisableColorPicking.event_name, this._onDisableColorPickingBind);

	}

	private onEnableColorPicking(): void {
		this.html_pixel_test_enabled = true;
	}

	private onDisableColorPicking(): void {
		this.html_pixel_test_enabled = false;
	}

	dispose(): void {
		super.dispose();
		document.removeEventListener(HTMLRenderEventEnableColorPicking.event_name, this.onEnableColorPicking);
		document.removeEventListener(HTMLRenderEventDisableColorPicking.event_name, this.onDisableColorPicking);
	}

}
