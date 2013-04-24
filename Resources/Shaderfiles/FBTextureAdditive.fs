precision lowp float;

uniform sampler2D uTexture;
uniform sampler2D uTexture2;

uniform float uTex1Rate;
uniform float uTex2Rate;

varying vec2 vTexCoords;

void main() {
	vec4 tex1 = texture2D(uTexture, vTexCoords);
	vec4 tex2 = texture2D(uTexture2, vTexCoords);

	gl_FragColor = vec4(tex1.rgb * uTex1Rate + tex2.rgb * uTex2Rate, 1.0);
}