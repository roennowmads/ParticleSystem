precision lowp float;

uniform sampler2D uBill;

varying vec2 vTexCoords;

void main(void) {

	//vec4 a = texture2D(uBill, vec2(0.0,0.0));

	gl_FragColor = texture2D(uBill, vTexCoords);
}
