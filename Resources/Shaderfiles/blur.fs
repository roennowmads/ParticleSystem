precision lowp float;

vec2 texelSize = vec2(.005,.005);
uniform sampler2D uTexture;

uniform int uOrientation;

const int blurAmount = 10;

varying vec2 vTexCoords;

void main ()
{
    float halfBlur = float(blurAmount) * 0.5;
    vec4 colour;
    
    if (uOrientation == 0) {
        //Blur horizontal
        for (int i = 0; i < blurAmount; i++) {            
            float offset = float(i) - halfBlur;
            colour += texture2D(uTexture, vTexCoords + vec2(offset * texelSize.x, 0.0));
        }
    }
    else {
        //Blur vertical
        for (int i = 0; i < blurAmount; i++) {
            float offset = float(i) - halfBlur;
            colour += texture2D(uTexture, vTexCoords + vec2(0.0, offset * texelSize.y));
        }
    }
    
    //Calculate average
    colour = colour / float(blurAmount);

	gl_FragColor = colour;
}