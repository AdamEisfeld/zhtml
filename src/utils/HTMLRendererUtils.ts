export type HTMLRenderMatrix = number[];
export type HTMLRenderSize = { width: number, height: number };
export type HTMLRenderFrustum = { top: number, left: number, right: number, bottom: number };
export type HTMLRenderRect = { x: number, y: number, width: number, height: number };

const _epsilon = (value: number): number => {
	return Math.round(value * 1000) / 1000;
};

export function useGetCameraTransformStyle(options: { camera_projection_matrix: HTMLRenderMatrix, camera_matrix_world_inverse: HTMLRenderMatrix, render_size: HTMLRenderSize, frustum?: HTMLRenderFrustum | null, subrect?: HTMLRenderRect | null }): string {

	const camera_transform_styles: string[] = [];

	// Extract field of view from the projection matrix
	const fov = options.camera_projection_matrix[5] * (options.render_size.height / 2);

	// Handle the case where we are rendering to a subrect in a larger viewing frustum
	if (options.subrect) {
		const scale_offset_x = options.subrect.width / options.render_size.width;
		const scale_offset_y = options.subrect.height / options.render_size.height;
		camera_transform_styles.push(`scale(${scale_offset_x}, ${scale_offset_y})`);
	}

	// Handle orthographic cameras
	if (options.frustum) {
		const tx = - ( options.frustum.right + options.frustum.left ) / 2;
		const ty = ( options.frustum.top + options.frustum.bottom ) / 2;
		camera_transform_styles.push(`scale(${fov})`);
		camera_transform_styles.push(`translate(${_epsilon(tx)}px, ${_epsilon(ty)}px)`);
	}
	
	// Handle perspective cameras
	if (!options.frustum) {
		camera_transform_styles.push(`perspective(${fov}px)`);
		camera_transform_styles.push(`translateZ(${fov}px)`);
	}

	// Apply the camera's projection matrix (flipping certain values to account for the difference between WebGL and CSS)
	camera_transform_styles.push(`matrix3d(
		${_epsilon(	options.camera_matrix_world_inverse[0])},
		${_epsilon(- options.camera_matrix_world_inverse[1])},
		${_epsilon(	options.camera_matrix_world_inverse[2])},
		${_epsilon(	options.camera_matrix_world_inverse[3])},
		${_epsilon(	options.camera_matrix_world_inverse[4])},
		${_epsilon(- options.camera_matrix_world_inverse[5])},
		${_epsilon(	options.camera_matrix_world_inverse[6])},
		${_epsilon(	options.camera_matrix_world_inverse[7])},
		${_epsilon(	options.camera_matrix_world_inverse[8])},
		${_epsilon(- options.camera_matrix_world_inverse[9])},
		${_epsilon(	options.camera_matrix_world_inverse[10])},
		${_epsilon(	options.camera_matrix_world_inverse[11])},
		${_epsilon(	options.camera_matrix_world_inverse[12])},
		${_epsilon(- options.camera_matrix_world_inverse[13])},
		${_epsilon(	options.camera_matrix_world_inverse[14])},
		${_epsilon(	options.camera_matrix_world_inverse[15])}
	)`);

	// Shift the camera to the center of the screen to match WebGL's coordinate system
	camera_transform_styles.push(`translate(${options.render_size.width / 2}px, ${options.render_size.height / 2}px)`);
	return camera_transform_styles.join(' ');

}

export function useGetElementTransformStyle(options: { elementMatrixWorld: HTMLRenderMatrix }): string {

	// Shift the element so that subsequent transforms are relative to the center of the element, to match WebGL's coordinate system
	// Apply the element's world matrix (flipping certain values to account for the difference between WebGL and CSS)

	return `translate(-50%, -50%) matrix3d(
		${_epsilon(	options.elementMatrixWorld[0])},
		${_epsilon(	options.elementMatrixWorld[1])},
		${_epsilon(	options.elementMatrixWorld[2])},
		${_epsilon(	options.elementMatrixWorld[3])},
		${_epsilon(- options.elementMatrixWorld[4])},
		${_epsilon(- options.elementMatrixWorld[5])},
		${_epsilon(- options.elementMatrixWorld[6])},
		${_epsilon(- options.elementMatrixWorld[7])},
		${_epsilon(	options.elementMatrixWorld[8])},
		${_epsilon(	options.elementMatrixWorld[9])},
		${_epsilon(	options.elementMatrixWorld[10])},
		${_epsilon(	options.elementMatrixWorld[11])},
		${_epsilon(	options.elementMatrixWorld[12])},
		${_epsilon(	options.elementMatrixWorld[13])},
		${_epsilon(	options.elementMatrixWorld[14])},
		${_epsilon(	options.elementMatrixWorld[15])}
	)`;
	
}

export function useBuildSceneContainer(): HTMLDivElement {

	const container = document.createElement('div');
	container.style.position = 'absolute';
	container.style.transformOrigin = '0 0';
	container.style.pointerEvents = 'none';
	container.style.overflow = 'hidden';
	return container;

}

export function useBuildCameraContainer(): HTMLDivElement {

	const container = document.createElement('div');
	container.style.position = 'absolute';
	container.style.top = '0';
	container.style.left = '0';
	container.style.width = '100%';
	container.style.height = '100%';
	container.style.transformStyle = 'preserve-3d';
	container.style.pointerEvents = 'none';
	return container;

}
