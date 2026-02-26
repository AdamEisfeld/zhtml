import * as THREE from 'three';
import { FileShaderMaterial, FileShaderMaterialParameters } from './FileShaderMaterial';
import { ZHTMLRenderEventEnableColorPicking } from '../events/ZHTMLRenderEventEnableColorPicking';
import { ZHTMLRenderEventDisableColorPicking } from '../events/ZHTMLRenderEventDisableColorPicking';

import beginHtml from './beginHtml.glsl';

export const ZHTMLShaderChunk: Record<string, string> = {
	beginHtml: beginHtml,
};

export class ZHTMLShaderMaterial extends FileShaderMaterial {

	static readonly htmlPixelTestColor = new THREE.Color(1.0, 0.5, 1.0);

	set htmlPixelTestEnabled(value: boolean) {
		this.uniforms.htmlPixelTestEnabled.value = value ? 1 : 0;
	}

	get htmlPixelTestEnabled(): boolean {
		return this.uniforms.htmlPixelTestEnabled.value === 1;
	}

	private _onEnableColorPickingBind: (event: ZHTMLRenderEventEnableColorPicking) => void;
	private _onDisableColorPickingBind: (event: ZHTMLRenderEventDisableColorPicking) => void;

	constructor(parameters?: FileShaderMaterialParameters) {

		const mutableParameters = parameters || {};

		// Inject required file chunks that users can reference in their HTML material subclasses
		const mutableFileChunks = mutableParameters.fileChunks || [];
		mutableFileChunks.push(ZHTMLShaderChunk);
		mutableParameters.fileChunks = mutableFileChunks;

		// Inject required uniforms for HTML rendering
		const mutableUniforms = mutableParameters.uniforms || {};
		mutableUniforms.htmlPixelTestEnabled = { value: 0 };
		mutableParameters.uniforms = mutableUniforms;
		
		super(mutableParameters);

		// Bind ZHTMLRenderEventEnableColorPicking to onEnableColorPicking
		this._onEnableColorPickingBind = this.onEnableColorPicking.bind(this);
		document.addEventListener(ZHTMLRenderEventEnableColorPicking.eventName, this._onEnableColorPickingBind);
		
		// Bind ZHTMLRenderEventDisableColorPicking to onDisableColorPicking
		this._onDisableColorPickingBind = this.onDisableColorPicking.bind(this);
		document.addEventListener(ZHTMLRenderEventDisableColorPicking.eventName, this._onDisableColorPickingBind);

	}

	private onEnableColorPicking(): void {
		this.htmlPixelTestEnabled = true;
	}

	private onDisableColorPicking(): void {
		this.htmlPixelTestEnabled = false;
	}

	dispose(): void {
		super.dispose();
		document.removeEventListener(ZHTMLRenderEventEnableColorPicking.eventName, this._onEnableColorPickingBind);
		document.removeEventListener(ZHTMLRenderEventDisableColorPicking.eventName, this._onDisableColorPickingBind);
	}

}
