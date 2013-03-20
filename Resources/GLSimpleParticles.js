"use strict";

function GLSimpleParticles (gl, id) {
	this.vertexPositionBuffer;
	this.vertexVelocityBuffer;
	this.indexNumItems = 0;
	this.identifier;
	this.itemSize;
	this.identifier = id;
}

GLSimpleParticles.prototype.generateParticlesAndBuffer = function (gl, particleCount) {
	this.vertexPositionBuffer = gl.createBuffer();
	this.vertexVelocityBuffer = gl.createBuffer();
	
	this.itemSize = 3;
	this.indexNumItems = particleCount;
	
	var size = 1;
	var halfSize = size*0.5;
	var maxInitVel = 10;
	var halfInitVel = maxInitVel/2;
	
	var vertBuffer = new Array(particleCount*3);  
	var verts = new Float32Array(vertBuffer); 
	vertBuffer = null;
	
	var velBuffer = new Array(particleCount*3);  
	var velos = new Float32Array(velBuffer);
	velBuffer = null;
	
	for (var i = 0; i<particleCount; i++) {
		var j = i*3;
		verts[j] = (Math.random()*size - halfSize);
		verts[j+1] = (Math.random()*size - halfSize);
		verts[j+2] = Math.random()*size - halfSize;
		
		velos[j] = Math.random()*maxInitVel - halfInitVel;
		velos[j+1] = Math.random()*maxInitVel - halfInitVel;
		velos[j+2] = Math.random()*maxInitVel - halfInitVel;
	}
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexVelocityBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, velos, gl.DYNAMIC_DRAW);
}

GLSimpleParticles.prototype.bindBuffers = function (gl) {
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
	gl.vertexAttribPointer(currentProgram.getAttribute("vertexPositionAttribute"), this.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexVelocityBuffer);
	gl.vertexAttribPointer(currentProgram.getAttribute("vertexVelocityAttribute"), this.itemSize, gl.FLOAT, false, 0, 0);
}

GLSimpleParticles.prototype.draw = function (gl) {
	if (this.identifier != lastGLObject) 		//Optimizes by not binding buffers again for subsequent instances of the same mesh.
		this.bindBuffers(gl);

	setMVMatrixUniforms(gl);
	gl.drawArrays(gl.POINTS, 0, this.indexNumItems);
	
	lastGLObject = this.identifier;
}