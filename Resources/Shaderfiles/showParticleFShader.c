precision lowp float;

uniform sampler2D uPos;

varying vec4 vColor;
varying vec2 vTexCoords;

void main(void) {
	//Copy texture and amplify differences:
	gl_FragColor = vec4(1.0,1.0,1.0,1.0);//vColor;//vec4(((1.0 - texture2D(uPos, vTexCoords)).xyz), 1.0) ;
}
