export type ZHTMLRenderMatrix = number[];
export type ZHTMLRenderSize = { width: number, height: number };
export type ZHTMLRenderFrustum = { top: number, left: number, right: number, bottom: number };
export type ZHTMLRenderRect = { x: number, y: number, width: number, height: number };

const _epsilon = (value: number): number => {
	return Math.round(value * 1000) / 1000;
};

export function getCameraTransformStyle(options: { cameraProjectionMatrix: ZHTMLRenderMatrix, cameraMatrixWorldInverse: ZHTMLRenderMatrix, renderSize: ZHTMLRenderSize, frustum?: ZHTMLRenderFrustum | null, subrect?: ZHTMLRenderRect | null }): string {

	const cameraTransformStyles: string[] = [];

	// Extract field of view from the projection matrix
	const fov = options.cameraProjectionMatrix[5] * (options.renderSize.height / 2);

	// Handle the case where we are rendering to a subrect in a larger viewing frustum
	if (options.subrect) {
		const scaleOffsetX = options.subrect.width / options.renderSize.width;
		const scaleOffsetY = options.subrect.height / options.renderSize.height;
		cameraTransformStyles.push(`scale(${scaleOffsetX}, ${scaleOffsetY})`);
	}

	// Handle orthographic cameras
	if (options.frustum) {
		const tx = - ( options.frustum.right + options.frustum.left ) / 2;
		const ty = ( options.frustum.top + options.frustum.bottom ) / 2;
		cameraTransformStyles.push(`scale(${fov})`);
		cameraTransformStyles.push(`translate(${_epsilon(tx)}px, ${_epsilon(ty)}px)`);
	}
	
	// Handle perspective cameras
	if (!options.frustum) {
		cameraTransformStyles.push(`perspective(${fov}px)`);
		cameraTransformStyles.push(`translateZ(${fov}px)`);
	}

	// Apply the camera's projection matrix (flipping certain values to account for the difference between WebGL and CSS)
	cameraTransformStyles.push(`matrix3d(
		${_epsilon(	options.cameraMatrixWorldInverse[0])},
		${_epsilon(- options.cameraMatrixWorldInverse[1])},
		${_epsilon(	options.cameraMatrixWorldInverse[2])},
		${_epsilon(	options.cameraMatrixWorldInverse[3])},
		${_epsilon(	options.cameraMatrixWorldInverse[4])},
		${_epsilon(- options.cameraMatrixWorldInverse[5])},
		${_epsilon(	options.cameraMatrixWorldInverse[6])},
		${_epsilon(	options.cameraMatrixWorldInverse[7])},
		${_epsilon(	options.cameraMatrixWorldInverse[8])},
		${_epsilon(- options.cameraMatrixWorldInverse[9])},
		${_epsilon(	options.cameraMatrixWorldInverse[10])},
		${_epsilon(	options.cameraMatrixWorldInverse[11])},
		${_epsilon(	options.cameraMatrixWorldInverse[12])},
		${_epsilon(- options.cameraMatrixWorldInverse[13])},
		${_epsilon(	options.cameraMatrixWorldInverse[14])},
		${_epsilon(	options.cameraMatrixWorldInverse[15])}
	)`);

	// Shift the camera to the center of the screen to match WebGL's coordinate system
	cameraTransformStyles.push(`translate(${options.renderSize.width / 2}px, ${options.renderSize.height / 2}px)`);
	return cameraTransformStyles.join(' ');

}

export function getElementTransformStyle(options: { elementMatrixWorld: ZHTMLRenderMatrix }): string {

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

export function buildSceneContainer(): HTMLDivElement {

	const container = document.createElement('div');
	container.style.position = 'absolute';
	container.style.transformOrigin = '0 0';
	container.style.pointerEvents = 'none';
	container.style.overflow = 'hidden';
	return container;

}

export function buildCameraContainer(): HTMLDivElement {

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
