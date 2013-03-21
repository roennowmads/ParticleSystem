precision lowp float;

varying vec4 vColor;

void main(void) {
	gl_FragColor = vec4(vColor.xxx, 1.0);
}
