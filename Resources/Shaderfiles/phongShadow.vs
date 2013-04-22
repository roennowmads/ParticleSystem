attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

varying vec2 vTextureCoord;
varying vec3 vTransformedNormal;
varying vec4 vPosition;		

varying vec3 vLightingPosition;

varying vec4 vVL;
uniform mat4 uVLMatrix;

uniform mat4 uMMatrix;
uniform mat4 uVMatrix;

//uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;

uniform vec3 uLightingPosition;

const mat4 depthScaleMatrix = mat4(0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.5, 0.5, 0.5, 1.0);

void main(void) {
	vec4 posPure = vec4(aVertexPosition, 1.0);
	vVL = depthScaleMatrix * uPMatrix * uVLMatrix * uMMatrix * posPure;

	vPosition = uVMatrix * uMMatrix * posPure;
	gl_Position = uPMatrix * vPosition;
	vTextureCoord = aTextureCoord;

	vTransformedNormal = uNMatrix * aVertexNormal;
	vLightingPosition = uLightingPosition - vPosition.xyz;
}
