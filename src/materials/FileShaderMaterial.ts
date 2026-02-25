import * as THREE from 'three';

export type FileShaderMaterialParameters = {
	fileChunks?: Record<string, string>[],
} & THREE.ShaderMaterialParameters;

export class FileShaderMaterial extends THREE.ShaderMaterial {

	constructor(parameters?: FileShaderMaterialParameters) {

		const mutableParameters = parameters || {};

		// Replace includes with known scripts
		if (parameters?.fileChunks) {
			for (let f = 0; f < parameters.fileChunks.length; f++) {
				const fileChunk = parameters.fileChunks[f];
				const includeNames = Object.keys(fileChunk);
				for (let i = 0, l = includeNames.length; i < l; i += 1) {
					const includeName = includeNames[i];
					const includeValue = fileChunk[includeName];
					mutableParameters.fragmentShader = mutableParameters.fragmentShader?.replace(`#include <${includeName}>`, includeValue);
					mutableParameters.vertexShader = mutableParameters.vertexShader?.replace(`#include <${includeName}>`, includeValue);
				}
			}
		}

		delete mutableParameters.fileChunks;

		super(mutableParameters);

	}

}
