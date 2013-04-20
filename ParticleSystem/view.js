"use strict";

function View() {
	this.canvas;
	this.gl;
	
	this.house = new House(this);
	this.groundModel;
	this.groundTex;
	
	this.rotYAngle = 0;
	this.deltaTime = 0;
	this.zoomFactor = 1.0;

	//this.DRAWTARGETS = { CANVAS : 0, FRAMEBUFFER : 1 };

	this.lastGLObject;
	this.lastDrawTarget;

	this.numPointsSqrt = document.getElementById("objectCount").value;
	this.numPoints = this.numPointsSqrt * this.numPointsSqrt;
	
	this.isUpdatingVelocities = true;
	this.isUpdatingPositions = true;
	
	this.scripts;
	this.particles;
}

View.prototype.initView = function () {
	this.canvas = document.getElementById("canvas");
	this.gl = initGL(this.canvas);
	var float_texture_ext = this.gl.getExtension('OES_texture_float');
	if (!float_texture_ext)
		alert("OES_texture_float extension is not available!");
		
	this.scripts = new ShaderScriptLoader(this.gl, this.loadTextures, this);
	this.scripts.addProgram("showBillboardShader", "showBillboard", "showBillboard");
	this.scripts.addProgram("initialParticleShader", "FBTexture", "initialParticle");
	this.scripts.addProgram("updateVelParticleShader", "FBTexture", "updateVelParticle");
	this.scripts.addProgram("updatePosParticleShader", "FBTexture", "updatePosParticle");
	this.scripts.addProgram("shadowShader", "FBTexture", "FBTexture");
	this.scripts.addProgram("phongShader", "phong", "phong");
	
	//Downloads scripts and calls loadTextures when done, which calls setupShadersAndObjects when done:
	this.scripts.loadScripts();
}

View.prototype.setupShadersAndObjects = function (thisClass) {	
	thisClass.particles = new Particles(thisClass, thisClass.smokeTex, true);
	thisClass.particles2 = new Particles(thisClass, thisClass.house.textures[0], false);
	thisClass.shadowFBinit(thisClass.gl);

	thisClass.setupCanvas(thisClass.gl);
	
	thisClass.particles.setup(thisClass.gl);
	thisClass.particles2.setup(thisClass.gl);
	thisClass.setupPhongShader(thisClass.gl);
	thisClass.loadModels(thisClass.gl);
}

View.prototype.animate = function () {
	timeNow = Date.now();
	var elapsed = timeNow - timeLast;
    this.deltaTime = 0.001 * elapsed * 60;
	
	//console.log(this.deltaTime);
	//this.rotYAngle += delta;
	
	if (this.isUpdatingPositions) 
		this.rotYAngle = 0;
		
	timeLast = timeNow;
}

View.prototype.draw = function () {
	//Clear the screen:
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [0, 0, -3.5]);
	
	this.shadowFB.unbind(this.gl);
	this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
	this.drawHouseAndGround(this.gl);
	
	mat4.translate(mvMatrix, [0, 1.0, 0]);
	
	var quatY = quat4.fromAngleAxis(-Math.PI*0.4, [1,0,0]);
	var quatX = quat4.fromAngleAxis(Math.PI, [0,1,0]);
	var quatRes = quat4.multiply(quatX, quatY);
	var rotMatrix = quat4.toMat4(quatRes);
	mat4.multiply(mvMatrix, rotMatrix);
	
	this.shadowFB.bind(this.gl, this.shadowFB.front);
	this.gl.viewport(0, 0, this.shadowFB.widthFB, this.shadowFB.widthFB);
	this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
	this.drawHouseAndGround(this.gl);
	
	this.currentProgram = this.scripts.getProgram("shadowShader").useProgram(this.gl);
	this.shadowFB.unbind(this.gl);
	this.particles.FBparticlesModel.drawOnFBMulti(this.gl, this.shadowFB, this.shadowFB.texBack, this.shadowFB.texBack);
	
	//this.particles.FBparticlesModel.drawOnFB(this.gl, this.shadowFB);
	//this.particles.draw(this.gl);
	
	//this.particles2.draw(this.gl);
}

View.prototype.setupCanvas = function (gl) {
	gl.clearColor(0.1, 0.1, 0.2, 1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.frontFace(gl.CCW);
	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.BACK);
	
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 1000.0, pMatrix);
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
}

function tick () {
	view.draw();
	view.animate();
	logFrameRate();
	requestAnimFrame(tick);
}

function startTicking() {
	tick();
}

View.prototype.shadowFBinit = function (gl) {
	//this.currentProgram = this.scripts.getProgram("showBillboardShader").useProgram(gl);
	this.shadowFB = new FBO(gl, 256);
}

View.prototype.drawHouseAndGround = function (gl) {
	this.currentProgram = this.scripts.getProgram("phongShader").useProgram(gl);
	
	mvPushMatrix();
		gl.disable(gl.BLEND);
		
		var quatY = quat4.fromAngleAxis(Math.PI*0.25, [1,0,0]);
		var quatX = quat4.fromAngleAxis(0*this.rotYAngle, [0,1,0]);
		var quatRes = quat4.multiply(quatX, quatY);
		var rotMatrix = quat4.toMat4(quatRes);
		mat4.multiply(mvMatrix, rotMatrix);
		
		mat4.scale(mvMatrix, [this.zoomFactor, this.zoomFactor, this.zoomFactor]);
		
		mat4.translate(mvMatrix, [0.0,-.5,-2.0]);
		
		var quatY = quat4.fromAngleAxis(0*Math.PI*0.25, [1,0,0]);
		var quatX = quat4.fromAngleAxis(this.rotYAngle, [0,1,0]);
		var quatRes = quat4.multiply(quatX, quatY);
		var rotMatrix = quat4.toMat4(quatRes);
		mat4.multiply(mvMatrix, rotMatrix);
		
		//Ground:
		mvPushMatrix();
			mat4.translate(mvMatrix, [0.0,-.16,0.0]);
			mat4.scale(mvMatrix, [3, 0.05, 3]);
			this.groundModel.texture = this.groundTex.texture;
			this.groundModel.draw(gl);
		mvPopMatrix();
		
		mat4.scale(mvMatrix, [.001, .001, .001]);
		
		//House
		this.house.draw(gl);
		gl.enable(this.gl.BLEND);
	mvPopMatrix();
}

View.prototype.setupPhongShader = function (gl) {
	this.currentProgram = this.scripts.getProgram("phongShader").useProgram(gl);
	gl.uniform3f(this.currentProgram.getUniform("lightingPositionUniform"), 0, 0, 0);
	this.setMVMatrixUniforms(gl);
	this.setPMatrixUniform(gl);
	this.setNormalUniforms(gl); 
}

View.prototype.setupShadowShader = function (gl) {
	this.currentProgram = this.scripts.getProgram("shadowShader").useProgram(gl);
	gl.uniform1i(this.view.currentProgram.getUniform("textureUniform"), 0);
} 

View.prototype.setPMatrixUniform = function (gl) {
	gl.uniformMatrix4fv(this.currentProgram.getUniform("pMatrixUniform"), false, pMatrix);
}

View.prototype.setMVMatrixUniforms = function (gl) {
    gl.uniformMatrix4fv(this.currentProgram.getUniform("mVMatrixUniform"), false, mvMatrix);
}

View.prototype.setNormalUniforms = function (gl) {   
    var normalMatrix = mat3.create();
    mat4.toInverseMat3(mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
    gl.uniformMatrix3fv(this.currentProgram.getUniform("nMatrixUniform"), false, normalMatrix);
}

//Loading of files:
View.prototype.loadModels = function (gl) {
	this.groundModel = new GLObject(gl, this);
	
	var objectLoader = new FileLoader(13, startTicking, this); 
	this.house.loadModels(gl, objectLoader);
	loadMesh(gl, this.groundModel, "/ParticleSystem/ParticleSystem/Resources/x-models/cube1.ctm", objectLoader);
}

View.prototype.loadTextures = function(thisClass) {
	thisClass.cubeTex = new Texture();
	thisClass.smokeTex = new Texture();
	thisClass.groundTex = new Texture();
	
	var objectLoader = new FileLoader(13, thisClass.setupShadersAndObjects, thisClass); 
	thisClass.house.loadTextures(thisClass.gl, objectLoader);
	loadImageToTex(thisClass.gl, thisClass.groundTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/Mortar_color.jpg", objectLoader);
	//loadImageToTex(thisClass.gl, thisClass.cubeTex, "/ParticleSystem/ParticleSystem/Resources/x-images/red.png", objectLoader, true);
	loadImageToTex(thisClass.gl, thisClass.smokeTex, "/ParticleSystem/ParticleSystem/Resources/x-images/smoke.png", objectLoader, true);
}