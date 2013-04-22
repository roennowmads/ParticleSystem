attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

varying vec2 vTextureCoord;
varying vec3 vTransformedNormal;
varying vec4 vPosition;		

varying vec3 vLightingPosition;

//uniform mat4 uMVMatrix;

uniform mat4 uMMatrix;
uniform mat4 uVLMatrix;

uniform mat4 uPMatrix;
uniform mat3 uNMatrix;

varying vec4 vProjPos;

uniform vec3 uLightingPosition;

void main(void) {
	vPosition = uMMatrix * vec4(aVertexPosition, 1.0);
	
	vProjPos = uPMatrix * vPosition;
	
	gl_Position = uPMatrix * uVLMatrix * vPosition;
	vTextureCoord = aTextureCoord;

	vTransformedNormal = uNMatrix * aVertexNormal;
	vLightingPosition = uLightingPosition - vPosition.xyz;
}
