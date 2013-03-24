attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

varying vec2 vTextureCoord;
varying vec3 vTransformedNormal;
varying vec4 vPosition;		

varying vec3 vLightingPosition;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;

uniform vec3 uLightingPosition;

void main(void) {
	vPosition = uMVMatrix * vec4(aVertexPosition, 1.0);
	gl_Position = uPMatrix * vPosition;
	vTextureCoord = aTextureCoord;

	vTransformedNormal = uNMatrix * aVertexNormal;
	vLightingPosition = uLightingPosition - vPosition.xyz;
}
