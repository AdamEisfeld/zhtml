/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 * @author AdamEisfeld / http://github.com/AdamEisfeld
 */

import * as THREE from 'three';

/**
 * This is a re-write of Three / XanderLuciano's OrbitControls (see: https://gist.github.com/XanderLuciano/5ce51976fd18beffdc118fd29b547c05).
 * It has been re-written in Typescript, with these additional changes:
 * - A new onShouldBegin property can be configured to prevent the controls from handling start events (mousedown, touchstart, etc) if desired.
 * - The keyboard values have been changed from deprecated keycodes to string-based key values.
 * - The domElement is now configured at runtime by calling attach() and detach() methods.
 */
export class ZHTMLOrbitControls {

	// MARK: - HTML Additions

	public onShouldBegin: (event: Event) => boolean = () => true;

	// MARK: - Properties

	public enabled: boolean = true;
	public object: THREE.Object3D;
	public domElement: HTMLElement | Document | null = null;

	// "target" sets the location of focus, where the object orbits around
	public target: THREE.Vector3 = new THREE.Vector3();

	// How far you can dolly in and out ( PerspectiveCamera only )
	public minDistance: number = 0;
	public maxDistance: number = Infinity;

	// How far you can zoom in and out ( OrthographicCamera only )
	public minZoom: number = 0;
	public maxZoom: number = Infinity;

	// How far you can orbit vertically, upper and lower limits.
	// Range is 0 to Math.PI radians.
	public minPolarAngle: number = 0; // radians
	public maxPolarAngle: number = Math.PI; // radians

	// How far you can orbit horizontally, upper and lower limits.
	// If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
	public minAzimuthAngle: number = -Infinity; // radians
	public maxAzimuthAngle: number = Infinity; // radians

	// Set to true to enable damping (inertia)
	// If damping is enabled, you must call controls.update() in your animation loop
	public enableDamping: boolean = true;
	public dampingFactor: number = 0.25;

	// This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
	// Set to false to disable zooming
	public enableZoom: boolean = true;
	public zoomSpeed: number = 1.0;

	// Set to false to disable rotating
	public enableRotate: boolean = true;
	public rotateSpeed: number = 1.0;

	// Set to false to disable panning
	public enablePan: boolean = true;
	public keyPanSpeed: number = 7.0; // pixels moved per arrow key push

	// Set to true to automatically rotate around the target
	// If auto-rotate is enabled, you must call controls.update() in your animation loop
	public autoRotate: boolean = false;
	public autoRotateSpeed: number = 2.0; // 30 seconds per round when fps is 60

	// Set to false to disable use of the keys
	public enableKeys: boolean = true;

	// The four arrow keys
	public keys: { LEFT: string, UP: string, RIGHT: string, BOTTOM: string } = {
		LEFT: 'ArrowLeft',
		UP: 'ArrowUp',
		RIGHT: 'ArrowRight',
		BOTTOM: 'ArrowDown'
	};

	// Mouse buttons
	public mouseButtons: { ORBIT: number, ZOOM: number, PAN: number } = {
		ORBIT: THREE.MOUSE.ROTATE,
		ZOOM: THREE.MOUSE.DOLLY,
		PAN: THREE.MOUSE.PAN
	};

	// Set to true to enable both dollying and panning with two fingers, instead of just dollying.
	public enableTwoFingerZoomPan: boolean = false;

	private changeEvent: { type: string } = { type: 'change' };
	private startEvent: { type: string } = { type: 'start' };
	private endEvent: { type: string } = { type: 'end' };
	
	private STATE: { NONE: number, ROTATE: number, DOLLY: number, PAN: number, TOUCH_ROTATE: number, TOUCH_DOLLY: number, TOUCH_PAN: number, TOUCH_DOLLY_PAN: number } = {
		NONE: -1,
		ROTATE: 0,
		DOLLY: 1,
		PAN: 2,
		TOUCH_ROTATE: 3,
		TOUCH_DOLLY: 4,
		TOUCH_PAN: 5,
		TOUCH_DOLLY_PAN: 6
	};

	private state: number = this.STATE.NONE;

	private EPS: number = 0.000001;

	private spherical = new THREE.Spherical();
	private sphericalDelta = new THREE.Spherical();

	private scale: number = 1;
	private panOffset = new THREE.Vector3();
	private zoomChanged: boolean = false;

	private rotateStart = new THREE.Vector2();
	private rotateEnd = new THREE.Vector2();
	private rotateDelta = new THREE.Vector2();

	private panStart = new THREE.Vector2();
	private panEnd = new THREE.Vector2();
	private panDelta = new THREE.Vector2();

	private dollyStart = new THREE.Vector2();
	private dollyEnd = new THREE.Vector2();
	private dollyDelta = new THREE.Vector2();

	public constructor(object: THREE.Object3D) {
		this.object = object;
	}

	private bindOnContextMenu = this.onContextMenu.bind(this);
	private bindOnMouseDown = this.onMouseDown.bind(this);
	private bindOnMouseMove = this.onMouseMove.bind(this);
	private bindOnMouseUp = this.onMouseUp.bind(this);
	private bindOnMouseWheel = this.onMouseWheel.bind(this);
	private bindOnTouchStart = this.onTouchStart.bind(this);
	private bindOnTouchEnd = this.onTouchEnd.bind(this);
	private bindOnTouchMove = this.onTouchMove.bind(this);
	private bindOnKeyDown = this.onKeyDown.bind(this);

	public attach(element: HTMLElement) {
		if (this.domElement) {
			this.detach();
		}
		element.addEventListener( 'contextmenu', this.bindOnContextMenu, false );
		element.addEventListener( 'mousedown', this.bindOnMouseDown, false );
		element.addEventListener( 'wheel', this.bindOnMouseWheel, false );
		element.addEventListener( 'touchstart', this.bindOnTouchStart, false );
		element.addEventListener( 'touchend', this.bindOnTouchEnd, false );
		element.addEventListener( 'touchmove', this.bindOnTouchMove, false );
		document.addEventListener( 'mousemove', this.bindOnMouseMove, false );
		document.addEventListener( 'mouseup', this.bindOnMouseUp, false );
		window.addEventListener( 'keydown', this.bindOnKeyDown, false );
		this.domElement = element;
	}

	public detach() {
		if (!this.domElement) {
			return;
		}
		this.domElement.removeEventListener( 'contextmenu', this.bindOnContextMenu, false );
		this.domElement.removeEventListener( 'mousedown', this.bindOnMouseDown as EventListenerOrEventListenerObject, false );
		this.domElement.removeEventListener( 'wheel', this.bindOnMouseWheel as EventListenerOrEventListenerObject, false );
		this.domElement.removeEventListener( 'touchstart', this.bindOnTouchStart as EventListenerOrEventListenerObject, false );
		this.domElement.removeEventListener( 'touchend', this.bindOnTouchEnd as EventListenerOrEventListenerObject, false );
		this.domElement.removeEventListener( 'touchmove', this.bindOnTouchMove as EventListenerOrEventListenerObject, false );
		document.removeEventListener( 'mousemove', this.bindOnMouseMove, false );
		document.removeEventListener( 'mouseup', this.bindOnMouseUp, false );
		window.removeEventListener( 'keydown', this.bindOnKeyDown, false );
		this.domElement = null;
	}

	public getPolarAngle(): number {
		return this.spherical.phi;
	}

	public getAzimuthalAngle(): number {
		return this.spherical.theta;
	}

	public update(): boolean {
		
		const offset = new THREE.Vector3();

		// so camera.up is the orbit axis
		const quat = new THREE.Quaternion().setFromUnitVectors(this.object.up, new THREE.Vector3(0, 1, 0));
		const quatInverse = quat.clone().invert();

		const lastPosition = new THREE.Vector3();
		const lastQuaternion = new THREE.Quaternion();

		const position = this.object.position;

		offset.copy(position).sub(this.target);

		// rotate offset to "y-axis-is-up" space
		offset.applyQuaternion(quat);

		// angle from z-axis around y-axis
		this.spherical.setFromVector3(offset);

		if (this.autoRotate && this.state === this.STATE.NONE) {

			this.rotateLeft(this.getAutoRotationAngle());

		}

		this.spherical.theta += this.sphericalDelta.theta;
		this.spherical.phi += this.sphericalDelta.phi;

		// restrict theta to be between desired limits
		this.spherical.theta = Math.max(this.minAzimuthAngle, Math.min(this.maxAzimuthAngle, this.spherical.theta));

		// restrict phi to be between desired limits
		this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi));

		this.spherical.makeSafe();

		this.spherical.radius *= this.scale;

		// restrict radius to be between desired limits
		this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));

		// move target to panned location
		this.target.add(this.panOffset);

		offset.setFromSpherical(this.spherical);

		// rotate offset back to "camera-up-vector-is-up" space
		offset.applyQuaternion(quatInverse);

		position.copy(this.target).add(offset);

		this.object.lookAt(this.target);

		if (this.enableDamping === true) {

			this.sphericalDelta.theta *= (1 - this.dampingFactor);
			this.sphericalDelta.phi *= (1 - this.dampingFactor);

		} else {

			this.sphericalDelta.set(0, 0, 0);

		}

		this.scale = 1;
		this.panOffset.set(0, 0, 0);

		// update condition is:
		// min(camera displacement, camera rotation in radians)^2 > EPS
		// using small-angle approximation cos(x/2) = 1 - x^2 / 8

		if (this.zoomChanged ||
			lastPosition.distanceToSquared(this.object.position) > this.EPS ||
			8 * (1 - lastQuaternion.dot(this.object.quaternion)) > this.EPS) {

			this.dispatchEvent(this.changeEvent);

			lastPosition.copy(this.object.position);
			lastQuaternion.copy(this.object.quaternion);
			this.zoomChanged = false;

			return true;

		}

		return false;

	}

	dispose(): void {
		this.detach();
	}

	getAutoRotationAngle(): number {

		return 2 * Math.PI / 60 / 60 * this.autoRotateSpeed;

	}

	getZoomScale(): number {

		return Math.pow(0.95, this.zoomSpeed);

	}

	rotateLeft(angle: number): void {

		this.sphericalDelta.theta -= angle;

	}

	rotateUp(angle: number): void {

		this.sphericalDelta.phi -= angle;

	}

	panLeft(distance: number, objectMatrix: THREE.Matrix4): void {

		const v = new THREE.Vector3();

		v.setFromMatrixColumn(objectMatrix, 0); // get X column of objectMatrix
		v.multiplyScalar(- distance);

		this.panOffset.add(v);

	}

	panUp(distance: number, objectMatrix: THREE.Matrix4): void {

		const v = new THREE.Vector3();

		v.setFromMatrixColumn(objectMatrix, 1); // get Y column of objectMatrix
		v.multiplyScalar(distance);

		this.panOffset.add(v);

	}

	// deltaX and deltaY are in pixels; right and down are positive

	pan(deltaX: number, deltaY: number): void {

		if (!this.domElement) {
			return;
		}

		const element = this.domElement === document ? this.domElement.body : this.domElement;
		const elementWidth = (element instanceof Document ? window.innerWidth : element.clientWidth);
		const elementHeight = (element instanceof Document ? window.innerHeight : element.clientHeight);

		if (this.object instanceof THREE.PerspectiveCamera) {
			
			// perspective
			const position = this.object.position;
			const offset = position.clone().sub(this.target);
			let targetDistance = offset.length();

			// half of the fov is center to top of screen
			targetDistance *= Math.tan((this.object.fov / 2) * Math.PI / 180.0);

			// we actually don't use screenWidth, since perspective camera is fixed to screen height
			this.panLeft(2 * deltaX * targetDistance / elementHeight, this.object.matrix);
			this.panUp(2 * deltaY * targetDistance / elementHeight, this.object.matrix);

		} else if (this.object instanceof THREE.OrthographicCamera) {

			// orthographic
			this.panLeft(deltaX * (this.object.right - this.object.left) / this.object.zoom / elementWidth, this.object.matrix);
			this.panUp(deltaY * (this.object.top - this.object.bottom) / this.object.zoom / elementHeight, this.object.matrix);

		} else {

			// camera neither orthographic nor perspective
			console.warn('WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.');
			this.enablePan = false;

		}

	}

	dollyIn(dollyScale: number): void {

		if (this.object instanceof THREE.PerspectiveCamera) {

			this.scale /= dollyScale;

		} else if (this.object instanceof THREE.OrthographicCamera) {

			this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom * dollyScale));
			this.object.updateProjectionMatrix();
			this.zoomChanged = true;

		} else {

			console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
			this.enableZoom = false;

		}

	}

	dollyOut(dollyScale: number): void {

		if (this.object instanceof THREE.PerspectiveCamera) {

			this.scale /= dollyScale;

		} else if (this.object instanceof THREE.OrthographicCamera) {

			this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / dollyScale));
			this.object.updateProjectionMatrix();
			this.zoomChanged = true;

		} else {

			console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
			this.enableZoom = false;

		}

	}

	handleMouseDownRotate(event: MouseEvent): void {
		this.rotateStart.set(event.clientX, event.clientY);
	}

	handleMouseDownDolly(event: MouseEvent): void {
		this.dollyStart.set(event.clientX, event.clientY);
	}

	handleMouseDownPan(event: MouseEvent): void {
		this.panStart.set(event.clientX, event.clientY);
	}

	handleMouseMoveRotate(event: MouseEvent): void {

		if (!this.domElement) {
			return;
		}

		this.rotateEnd.set(event.clientX, event.clientY);
		this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);

		const element = this.domElement === document ? this.domElement.body : this.domElement;
		const elementWidth = (element instanceof Document ? window.innerWidth : element.clientWidth);
		const elementHeight = (element instanceof Document ? window.innerHeight : element.clientHeight);

		// rotating across whole screen goes 360 degrees around
		this.rotateLeft(2 * Math.PI * this.rotateDelta.x / elementWidth * this.rotateSpeed);

		// rotating up and down along whole screen attempts to go 360, but limited to 180
		this.rotateUp(2 * Math.PI * this.rotateDelta.y / elementHeight * this.rotateSpeed);

		this.rotateStart.copy(this.rotateEnd);

		this.update();

	}

	handleMouseMoveDolly(event: MouseEvent): void {

		this.dollyEnd.set(event.clientX, event.clientY);

		this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart);

		if (this.dollyDelta.y > 0) {

			this.dollyIn(this.getZoomScale());

		} else if (this.dollyDelta.y < 0) {

			this.dollyOut(this.getZoomScale());

		}

		this.dollyStart.copy(this.dollyEnd);

		this.update();

	}

	handleMouseMovePan(event: MouseEvent): void {

		this.panEnd.set(event.clientX, event.clientY);

		this.panDelta.subVectors(this.panEnd, this.panStart);

		this.pan(this.panDelta.x, this.panDelta.y);

		this.panStart.copy(this.panEnd);

		this.update();

	}

	handleMouseUp(_event: MouseEvent): void {
	}

	handleMouseWheel(event: WheelEvent): void {

		if (event.deltaY < 0) {

			this.dollyOut(this.getZoomScale());

		} else if (event.deltaY > 0) {

			this.dollyIn(this.getZoomScale());

		}

		this.update();

	}

	handleKeyDown(event: KeyboardEvent): void {

		switch (event.key) {

		case this.keys.UP:
			this.pan(0, this.keyPanSpeed);
			this.update();
			break;

		case this.keys.BOTTOM:
			this.pan(0, - this.keyPanSpeed);
			this.update();
			break;

		case this.keys.LEFT:
			this.pan(this.keyPanSpeed, 0);
			this.update();
			break;

		case this.keys.RIGHT:
			this.pan(- this.keyPanSpeed, 0);
			this.update();
			break;

		}

	}

	handleTouchStartRotate(event: TouchEvent): void {
		this.rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
	}

	handleTouchStartDolly(event: TouchEvent): void {
		const dx = event.touches[0].pageX - event.touches[1].pageX;
		const dy = event.touches[0].pageY - event.touches[1].pageY;

		const distance = Math.sqrt(dx * dx + dy * dy);

		this.dollyStart.set(0, distance);
	}

	handleTouchStartPan(event: TouchEvent): void {
		this.panStart.set(event.touches[0].pageX, event.touches[0].pageY);
	}

	handleTouchMoveRotate(event: TouchEvent): void {

		if (!this.domElement) {
			return;
		}

		this.rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
		this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);

		const element = this.domElement === document ? this.domElement.body : this.domElement;
		const elementWidth = (element instanceof Document ? window.innerWidth : element.clientWidth);
		const elementHeight = (element instanceof Document ? window.innerHeight : element.clientHeight);

		// rotating across whole screen goes 360 degrees around
		this.rotateLeft(2 * Math.PI * this.rotateDelta.x / elementWidth * this.rotateSpeed);

		// rotating up and down along whole screen attempts to go 360, but limited to 180
		this.rotateUp(2 * Math.PI * this.rotateDelta.y / elementHeight * this.rotateSpeed);

		this.rotateStart.copy(this.rotateEnd);

		this.update();

	}

	handleTouchMoveDolly(event: TouchEvent): void {

		const dx = event.touches[0].pageX - event.touches[1].pageX;
		const dy = event.touches[0].pageY - event.touches[1].pageY;

		const distance = Math.sqrt(dx * dx + dy * dy);

		this.dollyEnd.set(0, distance);

		this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart);

		if (this.dollyDelta.y > 0) {

			this.dollyOut(this.getZoomScale());

		} else if (this.dollyDelta.y < 0) {

			this.dollyIn(this.getZoomScale());

		}

		this.dollyStart.copy(this.dollyEnd);

		this.update();

	}

	handleTouchMovePan(event: TouchEvent): void {

		this.panEnd.set(event.touches[0].pageX, event.touches[0].pageY);

		this.panDelta.subVectors(this.panEnd, this.panStart);

		this.pan(this.panDelta.x, this.panDelta.y);

		this.panStart.copy(this.panEnd);

		this.update();

	}

	handleTouchEnd(_event: TouchEvent): void {
	}

	disable(): void {
		this.enabled = false;
	}

	// MARK: - Event Handlers

	onMouseDown(event: MouseEvent): void {
	
		if (this.enabled === false) return;
		if (this.onShouldBegin(event) === false) return;

		event.preventDefault();

		switch (event.button) {

		case this.mouseButtons.ORBIT:

			if (this.enableRotate === false) return;

			this.handleMouseDownRotate(event);

			this.state = this.STATE.ROTATE;

			break;

		case this.mouseButtons.ZOOM:

			if (this.enableZoom === false) return;

			this.handleMouseDownDolly(event);

			this.state = this.STATE.DOLLY;

			break;

		case this.mouseButtons.PAN:

			if (this.enablePan === false) return;

			this.handleMouseDownPan(event);

			this.state = this.STATE.PAN;

			break;

		}

		if (this.state !== this.STATE.NONE) {

			this.dispatchEvent(this.startEvent);

		}

	}

	onMouseMove(event: MouseEvent): void {

		if (this.enabled === false) return;

		switch (this.state) {

		case this.STATE.ROTATE:

			if (this.enableRotate === false) return;

			event.preventDefault();
			this.handleMouseMoveRotate(event);

			break;

		case this.STATE.DOLLY:

			if (this.enableZoom === false) return;

			event.preventDefault();
			this.handleMouseMoveDolly(event);

			break;

		case this.STATE.PAN:

			if (this.enablePan === false) return;

			event.preventDefault();
			this.handleMouseMovePan(event);

			break;

		}

	}

	onMouseUp(event: MouseEvent): void {

		if (this.enabled === false) return;

		this.handleMouseUp(event);
		this.dispatchEvent(this.endEvent);

		this.state = this.STATE.NONE;

	}

	onMouseWheel(event: WheelEvent): void {

		if (this.enabled === false || this.enableZoom === false || (this.state !== this.STATE.NONE && this.state !== this.STATE.ROTATE)) return;
		if (this.onShouldBegin(event) === false) return;

		if (!(this.domElement instanceof Document)) {
			// Only prevent non-passive events
			event.preventDefault();
			event.stopPropagation();
		}

		this.dispatchEvent(this.startEvent);

		this.handleMouseWheel(event);

		this.dispatchEvent(this.endEvent);

	}

	onKeyDown(event: KeyboardEvent): void {

		if (this.enabled === false || this.enableKeys === false || this.enablePan === false) return;

		this.handleKeyDown(event);

	}

	onTouchStart(event: TouchEvent): void {

		if (this.enabled === false) return;
		if (this.onShouldBegin(event) === false) return;

		switch (event.touches.length) {

		case 1:	// one-fingered touch: rotate

			if (this.enableRotate === false) return;

			this.handleTouchStartRotate(event);

			this.state = this.STATE.TOUCH_ROTATE;

			break;

		case 2:	// two-fingered touch: dolly

			if (this.enableZoom === false) return;

			this.handleTouchStartDolly(event);

			this.state = this.STATE.TOUCH_DOLLY;

			break;

		case 3: // three-fingered touch: pan

			if (this.enablePan === false) return;

			this.handleTouchStartPan(event);

			this.state = this.STATE.TOUCH_PAN;

			break;

		default:

			this.state = this.STATE.NONE;

		}

		if (this.state !== this.STATE.NONE) {

			this.dispatchEvent(this.startEvent);

		}

	}

	onTouchMove(event: TouchEvent): void {

		if (this.enabled === false) return;

		switch (event.touches.length) {

		case 1: // one-fingered touch: rotate

			if (this.enableRotate === false) return;
			if (this.state !== this.STATE.TOUCH_ROTATE) return;
			event.preventDefault();
			event.stopPropagation();

			this.handleTouchMoveRotate(event);

			break;

		case 2: // two-fingered touch: dolly

			if (this.enableZoom === false) return;
			if (this.state !== this.STATE.TOUCH_DOLLY) return;
			event.preventDefault();
			event.stopPropagation();
			
			this.handleTouchMoveDolly(event);

			break;

		case 3: // three-fingered touch: pan

			if (this.enablePan === false) return;
			if (this.state !== this.STATE.TOUCH_PAN) return;
			event.preventDefault();
			event.stopPropagation();

			this.handleTouchMovePan(event);

			break;

		default:

			this.state = this.STATE.NONE;

		}

	}

	onTouchEnd(event: TouchEvent): void {

		if (this.enabled === false) return;

		this.handleTouchEnd(event);

		this.dispatchEvent(this.endEvent);

		this.state = this.STATE.NONE;

	}

	onContextMenu(event: Event): void {

		if (this.enabled === false) return;
		if (this.onShouldBegin(event) === false) return;
		
		event.preventDefault();

	}

	// MARK: - Event Listeners

	_listeners: { [key: string]: ((event: Event) => void)[] } | undefined;

	addEventListener(type: string, listener: (event: Event) => void): void {

		if (this._listeners === undefined) this._listeners = {};

		const listeners = this._listeners;

		if (listeners[type] === undefined) {

			listeners[type] = [];

		}

		if (listeners[type].indexOf(listener) === - 1) {

			listeners[type].push(listener);

		}

	}

	hasEventListener(type: string, listener: (event: Event) => void): boolean {

		if (this._listeners === undefined) return false;

		const listeners = this._listeners;

		return listeners[type] !== undefined && listeners[type].indexOf(listener) !== - 1;

	}

	removeEventListener(type: string, listener: (event: Event) => void): void {

		if (this._listeners === undefined) return;

		const listeners = this._listeners;
		const listenerArray = listeners[type];

		if (listenerArray !== undefined) {

			const index = listenerArray.indexOf(listener);

			if (index !== - 1) {

				listenerArray.splice(index, 1);

			}

		}

	}

	dispatchEvent(event: Record<string, unknown>): void {

		if (this._listeners === undefined) return;

		const listeners = this._listeners;
		const listenerArray = listeners[event.type as string];

		if (listenerArray !== undefined) {

			event.target = this;

			const array = listenerArray.slice(0);

			for (let i = 0, l = array.length; i < l; i++) {

				array[i].call(this, event as never); 

			}

		}

	}

}
