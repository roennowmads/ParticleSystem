//#ifdef GL_ES
	precision highp float;
//#endif

varying vec2 vTextureCoord;
varying vec3 vTransformedNormal;
varying vec4 vPosition;
varying vec3 vLightingPosition;

uniform vec3 uLightingColor;
uniform sampler2D uSampler;

void main(void) {
	vec3 lightWeighting;
	bool useSpecular = true;

	lightWeighting = vec3(1.0, 1.0, 1.0);
	float specularLightWeighting = 0.0;
	vec3 lightDirection = normalize(vLightingPosition);
	vec3 transformedNormal = normalize(vTransformedNormal);

	vec3 reflectionDirection = reflect(-lightDirection, transformedNormal);
		
	float NdotL = dot(transformedNormal, lightDirection);

	if (useSpecular && NdotL > 0.0) {

		vec3 eyeDirection = normalize(-vPosition.xyz);
		specularLightWeighting = pow(max(dot(reflectionDirection, eyeDirection), 0.0), 10.0); //uMaterialShininess);
	}			

	float directionalLightWeighting = max(NdotL, 0.0);
	lightWeighting = /*uAmbientColor + uLightingColor **/ directionalLightWeighting + uLightingColor * specularLightWeighting;

	vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
	gl_FragColor = vec4(textureColor.rgb * lightWeighting, textureColor.a);
}
