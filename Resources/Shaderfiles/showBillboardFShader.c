precision lowp float;

uniform sampler2D uBill;

void main(void) {

	gl_FragColor = texture2D(uBill, vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y));
}
