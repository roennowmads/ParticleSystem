"use strict";

function GLFBParticles (gl, id, view) {
	this.vertexPositionBuffer;
	this.texCoordsBuffer;
	this.indexNumItems = 0;
	this.identifier;
	this.itemSize;
	this.identifier = id;
	this.texture;
	this.view = view;
}

GLFBParticles.prototype.createQuadAndSetup = function (gl) {
	this.vertexPositionBuffer = gl.createBuffer();
	this.texCoordsBuffer = gl.createBuffer();
	
	var verts = new Float32Array([
									-1.0, -1.0, 
									1.0, -1.0, 
									-1.0,  1.0, 
									-1.0,  1.0, 
									1.0, -1.0, 
									1.0,  1.0
	                             ]);
	
	var texCoords = new Float32Array([
	                                  0.0,  0.0,
	                                  1.0,  0.0,
	                                  0.0,  1.0,
	                                  0.0,  1.0,
	                                  1.0,  0.0,
	                                  1.0,  1.0
	                                 ]);
	
	this.itemSize = 2;
	this.indexNumItems = 6;
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.DYNAMIC_DRAW);
}

GLFBParticles.prototype.bindBuffers = function (gl) {
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
	gl.vertexAttribPointer(this.view.currentProgram.getAttribute("positionAttribute"), this.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordsBuffer);
	gl.vertexAttribPointer(this.view.currentProgram.getAttribute("texCoordsAttribute"), 2, gl.FLOAT, false, 0, 0);
}

GLFBParticles.prototype.drawOnFB = function (gl, FBO) {
	gl.viewport(0, 0, FBO.widthFB, FBO.heightFB);
	
    this.bindBuffers(gl);
    
    gl.drawArrays(gl.TRIANGLES, 0, this.indexNumItems);
}

GLFBParticles.prototype.drawOnFBOne = function (gl, FBO, texture) {
	gl.viewport(0, 0, FBO.widthFB, FBO.heightFB);
    
    this.bindBuffers(gl);
		
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
    
    gl.drawArrays(gl.TRIANGLES, 0, this.indexNumItems);
}

GLFBParticles.prototype.drawOnFBMulti = function (gl, FBO, texCurrent, texDelta) {
	gl.viewport(0, 0, FBO.widthFB, FBO.heightFB);
    
	this.bindBuffers(gl);
		
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texCurrent);
	
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, texDelta);
    
    gl.drawArrays(gl.TRIANGLES, 0, this.indexNumItems);
}