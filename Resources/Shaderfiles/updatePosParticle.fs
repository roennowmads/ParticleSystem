precision lowp float;

uniform sampler2D uCurrentPos;
uniform sampler2D uCurrentVel;
uniform float uTime;

varying vec2 vTexCoords;

void main(void) {
	vec3 current = vec3(texture2D(uCurrentPos, vTexCoords));
	vec3 delta = vec3(texture2D(uCurrentVel, vTexCoords));

	vec3 new = current + delta*.2*uTime;
	
	//if (new.y > 1.0 || new.y < -.5 || new.x > 1.0 || new.x < -0.5 || new.z > 1.0 || new.z < -0.5)
	//if (length(new - 0.5) > 1.0)
	//	discard;

	gl_FragColor = vec4(new, 1.0);
}
