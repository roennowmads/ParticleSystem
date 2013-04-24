attribute vec3 aVertexPosition;

uniform mat4 uPLMMatrix;

void main(void) {
	gl_Position = uPLMMatrix * vec4(aVertexPosition, 1.0);
}
