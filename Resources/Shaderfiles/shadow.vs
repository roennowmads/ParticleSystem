attribute vec3 aVertexPosition;

uniform mat4 uMMatrix;
uniform mat4 uLightVMatrix;
uniform mat4 uPMatrix;

void main(void) {
	gl_Position = uPMatrix * uLightVMatrix * uMMatrix * vec4(aVertexPosition, 1.0);
}
