"use strict";

function GLPlane (gl) {
	this.vertexPositionBuffer;
	this.indexNumItems = 0;
	this.identifier;
	this.itemSize;
}

GLPlane.prototype.generatePlaneBufferAndTick = function (gl, id) {
	this.vertexPositionBuffer = gl.createBuffer();
	var verticesArray = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
	this.itemSize = 2;
	this.indexNumItems = verticesArray.length / this.itemSize;
	this.identifier = id;
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, verticesArray, gl.STATIC_DRAW);
}

GLPlane.prototype.bindBuffers = function (gl) {
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
	gl.vertexAttribPointer(currentProgram.getAttribute("vertexPositionAttribute"), this.itemSize, gl.FLOAT, false, 0, 0);
}

GLPlane.prototype.draw = function (gl) {
	if (this.identifier != lastGLObject) 		//Optimizes by not binding buffers again for subsequent instances of the same mesh.
		this.bindBuffers(gl);

	setMVMatrixUniforms(gl);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.indexNumItems);
	
	lastGLObject = this.identifier;
}