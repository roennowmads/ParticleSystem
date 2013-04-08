precision lowp float;

uniform sampler2D uCurrentVel;
uniform sampler2D uCurrentPos;
uniform float uTime;
uniform vec2 uMousePos;
uniform float uMouseDown;

varying vec2 vTexCoords;

void main(void) {
	vec3 current = vec3(texture2D(uCurrentVel, vTexCoords));

	vec3 accelPoint = vec3(texture2D(uCurrentPos, vTexCoords));
	vec3 deltaDir = normalize(vec3(uMousePos, 0.0) - accelPoint) + vec3(cos(gl_FragCoord.y)*7.0, /*cos(gl_FragCoord.y)*7.0*/ 0.0, 0.0)*0.1;
	
	//Toggle anti-gravity if mouse button is pressed.
	deltaDir = uMouseDown*deltaDir;

	vec3 new = current + deltaDir*.03*uTime;
	
	//Drag;
	//new -= new*0.01;

	vec3 dir = normalize(new);
	float len = length(new);
	if (len > .5)
		new = dir*.5;

	gl_FragColor = vec4(new, 1.0);
}
