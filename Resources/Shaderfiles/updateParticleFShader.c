precision mediump float;

uniform sampler2D uCurrent;
uniform sampler2D uDelta;
uniform float uTime;
uniform vec2 uMousePos;

uniform bool uIsVel;
uniform bool uMouseDown;

varying vec2 vTexCoords;

void main(void) {
	//In order to get a point's acceleration, we need it's current position and the mouse position.
	//So all we need to do, is to add the current position here as a texture, and then we can find the individual accelerations.

	vec3 current = texture2D(uCurrent, vTexCoords).xyz;

	vec3 new;
	if (!uIsVel) {
		vec3 delta = texture2D(uDelta, vTexCoords).xyz;
		new = current + delta*.1;
	}
	else {
		vec3 accelPoint = vec3(texture2D(uDelta, vTexCoords).xy, 0.0);
		vec3 deltaDir = vec3(((normalize(vec3(uMousePos, 0.0) - accelPoint)).xyz));
		if (uMouseDown)
			deltaDir = -deltaDir;

		new = current + deltaDir*.01;

		vec3 dir = normalize(new);
		float len = length(new);
		if (len > .3)
			new = dir*.3;
	}

	gl_FragColor = vec4(new.xy,0.0, 1.0);
}
