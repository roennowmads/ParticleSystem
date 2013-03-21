attribute vec2 aVertexCoords;

varying vec2 vTexCoords;

uniform sampler2D uPos;
uniform sampler2D uBill;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

void main() {
	vec4 posFromTex = texture2D(uPos, aVertexCoords);
	vec4 position = /*vec4((*/(posFromTex - .5) * 2.0/*).xy, 0.0,1.0)*/;

	gl_PointSize = 1.0;
	gl_Position = uPMatrix * uMVMatrix * position;

	//vec4 a = texture2D(uBill, vec2(0.0,0.0));

	vTexCoords = vec2(position.xy + 0.5);
}
