precision lowp float;

varying float vTimes;

uniform sampler2D uCurrentPos;
uniform sampler2D uCurrentVel;
uniform float uTime;

varying vec2 vTexCoords;

void main(void) {
	vec3 current = vec3(texture2D(uCurrentPos, vTexCoords));
	vec3 delta = vec3(texture2D(uCurrentVel, vTexCoords));

	vec3 new = current;
	if (uTime > vTimes)
		new += delta*.05;

	gl_FragColor = vec4(new, 1.0);
}
