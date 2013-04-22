precision mediump float;

varying vec2 vTextureCoord;
varying vec3 vTransformedNormal;
varying vec4 vPosition;
varying vec3 vLightingPosition;

uniform vec3 uLightingColor;
uniform sampler2D uTexture;
uniform sampler2D uDepthMap;

varying vec4 vVL; 

void main(void) {
	vec3 lightWeighting;

	lightWeighting = vec3(1.0, 1.0, 1.0);
	float specularLightWeighting = 0.0;
	vec3 lightDirection = normalize(vLightingPosition);
	vec3 transformedNormal = normalize(vTransformedNormal);

	vec3 reflectionDirection = reflect(-lightDirection, transformedNormal);
		
	float NdotL = dot(transformedNormal, lightDirection);

	if (NdotL > 0.0) {
		vec3 eyeDirection = normalize(-vPosition.xyz);
		specularLightWeighting = pow(max(dot(reflectionDirection, eyeDirection), 0.0), 10.0); //uMaterialShininess);
	}			

	float directionalLightWeighting = max(NdotL, 0.0);
	lightWeighting = directionalLightWeighting + uLightingColor * specularLightWeighting;
	
	vec3 depth = vVL.xyz / vVL.w;
	float depthMapDepth = texture2D(uDepthMap, depth.xy).x;
	depth.z *= 0.999;
	
	vec4 textureColor = texture2D(uTexture, vTextureCoord);
	
	if (depthMapDepth < depth.z)
		lightWeighting *= 0.5;
	
	gl_FragColor = vec4(textureColor.rgb * lightWeighting, textureColor.a);
}
