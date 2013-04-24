precision lowp float;

attribute vec2 aVertexCoords;

uniform sampler2D uPos;

uniform mat4 uMMatrix;
uniform mat4 uLightVMatrix;
uniform mat4 uPMatrix;

void main() {
	vec4 posFromTex = texture2D(uPos, aVertexCoords);
	vec4 position = (posFromTex - .5) * 2.0;

	gl_PointSize = 10.0;

	gl_Position = uPMatrix * uLightVMatrix * uMMatrix * position;

}
