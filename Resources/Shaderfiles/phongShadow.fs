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

	//Phong shading:
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
	
	//Determine if the point is in shadow:
	vec3 projectedDepth = vVL.xyz / vVL.w;
	float depthMapDepth = texture2D(uDepthMap, projectedDepth.xy).x;
	
	//"Cure" shadow acne:
	projectedDepth.z *= 0.999;
	
	//If the distance to the camera from this fragment is larger than the distance recorded in the depth map, then in shadow:
	if (depthMapDepth < projectedDepth.z)
		lightWeighting *= 0.5;
	
	
	vec4 textureColor = texture2D(uTexture, vTextureCoord);
	gl_FragColor = vec4(textureColor.rgb * lightWeighting, textureColor.a);
}
