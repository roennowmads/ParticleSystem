attribute vec2 aVertexCoords;

varying vec2 vTexCoords;

varying vec4 vColor;

uniform sampler2D uPos;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

void main() {
	vTexCoords = aVertexCoords;

	vec4 posFromTex = texture2D(uPos, aVertexCoords);
	vec4 position = /*vec4((*/(posFromTex - .5) * 2.0/*).xy, 0.0,1.0)*/;

	gl_PointSize = 1.0;
	gl_Position = uPMatrix * uMVMatrix * position;


	vColor = gl_Position + 1.0;
}
