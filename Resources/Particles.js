"use strict";

function Particles (view, texture, mouseControlled) {
	this.view = view;
	this.texture = texture;
	this.FBparticlesModel; 
	this.showParticlesModel;
	this.velFB;
	this.posFB;
	this.first = true;
	this.mouseControlled = mouseControlled;
}


Particles.prototype.draw = function (gl) {
	if (this.first) 
    	this.drawInitialTextures(gl);
    
    var elapsedFromStart = (timeNow - startTime)*0.001;
    
    //Update velocities:
    if(this.view.isUpdatingVelocities)
    	this.updateVelocities(gl);
    
    //Update positions:
    if(this.view.isUpdatingPositions)
    	this.updatePositions(gl);
	
	mvPushMatrix();
		var quatY = quat4.fromAngleAxis(Math.PI/4, [1,0,0]);
		var quatX = quat4.fromAngleAxis(0*this.view.rotYAngle, [0,1,0]);
		var quatRes = quat4.multiply(quatX, quatY);
		var rotMatrix = quat4.toMat4(quatRes);
		mat4.multiply(mMatrix, rotMatrix);
		
		mat4.scale(mMatrix, [this.view.zoomFactor, this.view.zoomFactor, this.view.zoomFactor]);
		
		mat4.translate(mMatrix, [0.0,-1.0,-2.0]);
		
		var quatY = quat4.fromAngleAxis(0*Math.PI/4, [1,0,0]);
		var quatX = quat4.fromAngleAxis(this.view.rotYAngle, [0,1,0]);
		var quatRes = quat4.multiply(quatX, quatY);
		var rotMatrix = quat4.toMat4(quatRes);
		mat4.multiply(mMatrix, rotMatrix);
	
		mat4.scale(mMatrix, [0.5, 0.5, 0.5]);
		//Draw on canvas:
		this.drawBillboards(gl);
		//this.updateVelocities(this.gl, true);
		//this.updatePositions(this.gl, true);
	mvPopMatrix();
	
	this.posFB.swap();
	this.velFB.swap();
}

Particles.prototype.setup = function (gl) {
	this.setupUpdateVelShader(gl);
	this.setupUpdatePosShader(gl);
	this.setupFBAndInitTextures(gl);
	this.setupShowBillboardShader(gl);
}

//Draw functions:
Particles.prototype.drawBillboards = function (gl) { 
	this.view.currentProgram = this.view.scripts.getProgram("showBillboardShader").useProgram(gl);
	
	mvPushMatrix();
	    mat4.translate(mMatrix, [0, 0, 1]);		
	    this.showParticlesModel.drawBillboards(gl, this.posFB.texBack, this.texture.texture);
    mvPopMatrix();
}

Particles.prototype.updateVelocities = function (gl, toCanvas) {
	this.view.currentProgram = this.view.scripts.getProgram("updateVelParticleShader").useProgram(gl);
    
    gl.uniform1f(this.view.currentProgram.getUniform("timeUniform"), this.view.deltaTime);
	
	if (this.mouseControlled) {
		gl.uniform2f(this.view.currentProgram.getUniform("mousePosUniform"), /*0.5,0.5*/3*mouseX/gl.viewportWidth - 1, mouseY*3/gl.viewportHeight - 1/*Math.cos(rotYAngle*1.7)*0.5 + 0.5, Math.sin(rotYAngle*1.7)*0.5 + 0.5*/);
		gl.uniform1f(this.view.currentProgram.getUniform("mouseDownUniform"), mouseDown ? -1 : 1);  
    }
	else {
		gl.uniform2f(this.view.currentProgram.getUniform("mousePosUniform"), 0.5, 2);
		gl.uniform1f(this.view.currentProgram.getUniform("mouseDownUniform"), 1);  
	}
	if (!toCanvas)
		this.velFB.bind(gl, this.velFB.back);
    this.FBparticlesModel.drawOnFBMulti(gl, this.velFB, this.velFB.texFront, this.posFB.texFront);
	//this.velFB.unbind(gl);
}

Particles.prototype.updatePositions = function (gl, toCanvas) {
	this.view.currentProgram = this.view.scripts.getProgram("updatePosParticleShader").useProgram(gl);
    
    gl.uniform1f(this.view.currentProgram.getUniform("timeUniform"), this.view.deltaTime);

	if (!toCanvas)
		this.posFB.bind(gl, this.posFB.back);
    this.FBparticlesModel.drawOnFBMulti(gl, this.posFB, this.posFB.texFront, this.velFB.texFront);
	//this.posFB.unbind(gl);
}

Particles.prototype.drawInitialTextures = function (gl) {
	this.view.currentProgram = this.view.scripts.getProgram("initialParticleShader").useProgram(gl);
	
	//Initialize position texture:
	//var elapsedFromStart = (timeNow - startTime)*0.001;
	gl.uniform2f(this.view.currentProgram.getUniform("offsetUniform"), -0.5, -0.5);
	gl.uniform1f(this.view.currentProgram.getUniform("multiplierUniform"), 1.0);
	gl.uniform1f(this.view.currentProgram.getUniform("correctionUniform"), 0.45);
	
	this.posFB.bind(gl, this.posFB.back);
	this.FBparticlesModel.drawOnFB(gl, this.posFB);
	this.posFB.unbind(gl);
	///

	//Initialize velocity texture:
	gl.uniform2f(this.view.currentProgram.getUniform("offsetUniform"), -.5 , -0.5);
	gl.uniform1f(this.view.currentProgram.getUniform("multiplierUniform"), 0.1);
	gl.uniform1f(this.view.currentProgram.getUniform("correctionUniform"), 0.45);

	this.velFB.bind(gl, this.velFB.back);
	this.FBparticlesModel.drawOnFB(gl, this.velFB);
	this.velFB.unbind(gl);
	
	this.first = false;
	this.posFB.swap();
	this.velFB.swap();
	
}

//Setup functions:
Particles.prototype.setupShowBillboardShader = function (gl) {
	this.view.currentProgram = this.view.scripts.getProgram("showBillboardShader").useProgram(gl);
	
	gl.uniform1i(this.view.currentProgram.getUniform("posUniform"), 0);
	gl.uniform1i(this.view.currentProgram.getUniform("billUniform"), 1);
	
	this.view.setMVMatrixUniforms(gl);
	this.view.setPMatrixUniform(gl);
	
	this.showParticlesModel = new GLShowParticles(gl, 2, this.view);
	this.showParticlesModel.generateParticlesAndBuffer(gl, this.view.numPointsSqrt);
}

Particles.prototype.setupUpdatePosShader = function (gl) {
	this.view.currentProgram = this.view.scripts.getProgram("updatePosParticleShader").useProgram(gl);
	
	gl.uniform1i(this.view.currentProgram.getUniform("currentPosUniform"), 0);
	gl.uniform1i(this.view.currentProgram.getUniform("currentVelUniform"), 1);
}

Particles.prototype.setupUpdateVelShader = function (gl) {
	this.view.currentProgram = this.view.scripts.getProgram("updateVelParticleShader").useProgram(gl);
	
	gl.uniform1i(this.view.currentProgram.getUniform("currentVelUniform"), 0);
	gl.uniform1i(this.view.currentProgram.getUniform("currentPosUniform"), 1);
}

Particles.prototype.setupFBAndInitTextures = function (gl) {
	this.FBparticlesModel = new GLFBParticles(gl, 1, this.view);
	this.FBparticlesModel.createQuadAndSetup(gl);
	
	this.velFB = new FBO(gl, this.view.numPointsSqrt);
	this.posFB = new FBO(gl, this.view.numPointsSqrt);
}