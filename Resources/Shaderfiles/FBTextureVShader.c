attribute vec2 aPosition;
attribute vec2 aTexCoords;

attribute float aTimes;

varying vec2 vTexCoords;

varying float vTimes;

void main() {
	vTexCoords = aTexCoords;
	
	vTimes = aTimes;

	//Have the vertices be positioned at each corner of the frame:
	gl_Position = vec4(aPosition, 0, 1);
}
