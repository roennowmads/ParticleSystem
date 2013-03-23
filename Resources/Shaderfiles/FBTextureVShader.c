attribute vec2 aPosition;
attribute vec2 aTexCoords;

varying vec2 vTexCoords;

void main() {
	vTexCoords = aTexCoords;

	//Have the vertices be positioned at each corner of the frame:
	gl_Position = vec4(aPosition, 0, 1);
}
