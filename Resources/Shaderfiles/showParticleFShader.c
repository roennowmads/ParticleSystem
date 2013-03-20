precision lowp float;

varying vec4 vColor;
varying vec2 vTexCoords;

void main(void) {
	//Copy texture and amplify differences:
	gl_FragColor = vec4(vColor.xxx, 1.0);
}
