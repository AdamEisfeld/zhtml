import * as THREE from 'three';

export type FileShaderMaterialParameters = {
	file_chunks?: Record<string, string>[],
} & THREE.ShaderMaterialParameters;

export class FileShaderMaterial extends THREE.ShaderMaterial {

	constructor(parameters?: FileShaderMaterialParameters) {

		const mutable_parameters = parameters || {};

		// Replace includes with known scripts
		if (parameters?.file_chunks) {
			for (let f = 0; f < parameters.file_chunks.length; f++) {
				const file_chunk = parameters.file_chunks[f];
				const include_names = Object.keys(file_chunk);
				for (let i = 0, l = include_names.length; i < l; i += 1) {
					const include_name = include_names[i];
					const include_value = file_chunk[include_name];
					mutable_parameters.fragmentShader = mutable_parameters.fragmentShader?.replace(`#include <${include_name}>`, include_value);
					mutable_parameters.vertexShader = mutable_parameters.vertexShader?.replace(`#include <${include_name}>`, include_value);
				}
			}
		}

		delete mutable_parameters.file_chunks;

		super(mutable_parameters);

	}

}
