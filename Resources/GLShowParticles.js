"use strict";

function GLShowParticles (gl, id, view) {
	this.vertexCoordsBuffer;
	this.texture;
	this.indexNumItems = 0;
	this.identifier;
	this.itemSize;
	this.identifier = id;
	this.view = view;
}

GLShowParticles.prototype.generateParticlesAndBuffer = function (gl, particleCountSqrt, tex) {
	this.vertexCoordsBuffer = gl.createBuffer();
	
	this.itemSize = 2;
	this.indexNumItems = particleCountSqrt*particleCountSqrt;
	
	var array = new Array(this.indexNumItems*this.itemSize);  
	var vertexCoords = new Float32Array(array); 
	array = null;
	
	var particleCountSqrt = particleCountSqrt;
	
	//From 1D array to 2D array:
	for (var i = 0; i<this.indexNumItems; i++) {
		var j = i*2;
		vertexCoords[j] = (j % particleCountSqrt) / particleCountSqrt; //column
		vertexCoords[j+1] = ((j+1) / particleCountSqrt) / particleCountSqrt; //row
	}
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexCoordsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertexCoords, gl.STATIC_DRAW);
	
	vertexCoords = null;
	this.texture = tex;
}

GLShowParticles.prototype.bindBuffers = function (gl) {
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexCoordsBuffer);
	gl.vertexAttribPointer(this.view.currentProgram.getAttribute("vertexCoordsAttribute"), this.itemSize, gl.FLOAT, false, 0, 0);
}

GLShowParticles.prototype.draw = function (gl, texVel) {
	//If somehow I could optimize by checking whether all previous changes where done on another program, then i wouldn't have to update.
	//if (this.identifier != lastGLObject && lastDrawTarget != DRAWTARGETS.CANVAS) 		//Optimizes by not binding buffers again for subsequent instances of the same mesh.
		this.bindBuffers(gl);

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	
	//Bind texture to read vertex positions from:
	gl.bindTexture(gl.TEXTURE_2D, this.texture);
	
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, texVel);
	
	gl.activeTexture(gl.TEXTURE0);
	
	this.view.setMVMatrixUniforms(gl);
	gl.drawArrays(gl.POINTS, 0, this.indexNumItems); //will always use texture0
	
	//lastGLObject = this.identifier;
    //lastDrawTarget = DRAWTARGETS.CANVAS;
}