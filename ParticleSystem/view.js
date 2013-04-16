"use strict";

function View() {
	this.canvas;
	this.gl;
	this.cubeModel; this.planeModel; this.FBparticlesModel; this.showParticlesModel;
	this.cubeTex; this.planeTex;
	this.rotYAngle = 0;
	this.deltaTime = 0;

	this.DRAWTARGETS = { CANVAS : 0, FRAMEBUFFER : 1 };

	this.lastGLObject;
	this.lastDrawTarget;
	this.currentTexture;

	this.numPointsSqrt = document.getElementById("objectCount").value;
	this.numPoints = this.numPointsSqrt * this.numPointsSqrt;

	this.FB;

	this.texPos; this.texVel;
	this.texCurrentPos; this.texAccel;

	this.zoomFactor = 1.0;
	
	this.first = true;
	
	this.isUpdatingVelocities = true;
	this.isUpdatingPositions = true;
	
	this.scripts;
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
	this.scripts.addProgram("phongShader", "phong", "phong");
	
	//Downloads scripts and calls loadTextures when done, which calls setupShadersAndObjects when done:
	this.scripts.loadScripts();
}

View.prototype.setupShadersAndObjects = function (thisClass) {	
	thisClass.setupCanvas(thisClass.gl);
	
	thisClass.setupUpdateVelShader(thisClass.gl);
	thisClass.setupUpdatePosShader(thisClass.gl);
	thisClass.setupFBAndInitTextures(thisClass.gl);
	thisClass.setupShowBillboardShader(thisClass.gl);
	thisClass.setupPhongShader(thisClass.gl);
	
	//startTicking();
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
    var quatY = quat4.fromAngleAxis(0*Math.PI/2, [1,0,0]);
	var quatX = quat4.fromAngleAxis(this.rotYAngle, [0,1,0]);
	var quatRes = quat4.multiply(quatX, quatY);
	var rotMatrix = quat4.toMat4(quatRes);
	mat4.multiply(mvMatrix, rotMatrix);
    
	mat4.scale(mvMatrix, [this.zoomFactor, this.zoomFactor, this.zoomFactor]);
	
	/*this.currentProgram = this.scripts.getProgram("phongShader").useProgram(this.gl);
    this.cubeModel.texture = this.cubeTex.texture;	
	
	
	mvPushMatrix();
		this.gl.disable(this.gl.BLEND);
		mat4.translate(mvMatrix, [0.0,-.5,0.0]);
		mat4.scale(mvMatrix, [1, .0625, 1]);
		this.cubeModel.draw(this.gl);
		this.gl.enable(this.gl.BLEND);
	mvPopMatrix();*/
	
	
    if (this.first) 
    	this.drawInitialTextures(this.gl);
    
    var elapsedFromStart = (timeNow - startTime)*0.001;
    
    //Update velocities:
    if(this.isUpdatingVelocities)
    	this.updateVelocities(this.gl);
    
    //Update positions:
    if(this.isUpdatingPositions)
    	this.updatePositions(this.gl);
	
    //Draw on canvas:
	this.drawBillboards(this.gl);
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

//Draw functions:
View.prototype.drawBillboards = function (gl) {
	this.currentProgram = this.scripts.getProgram("showBillboardShader").useProgram(gl);
	
	mvPushMatrix();
	    mat4.translate(mvMatrix, [0, 0, 1]);
	    
		this.showParticlesModel.posTex = this.texCurrentPos;
		//gl.activeTexture(gl.TEXTURE0);
		
	    this.showParticlesModel.drawBillboards(gl, this.smokeTex.texture);
    mvPopMatrix();
}

View.prototype.updateVelocities = function (gl) {
	this.currentProgram = this.scripts.getProgram("updateVelParticleShader").useProgram(gl);
    
    gl.uniform1f(this.currentProgram.getUniform("timeUniform"), this.deltaTime);
    gl.uniform2f(this.currentProgram.getUniform("mousePosUniform"), /*0.5,0.5*/mouseX*2.1/gl.viewportWidth - 0.55, 1 - mouseY*1.5/gl.viewportHeight + 0.25 /*Math.cos(rotYAngle*1.7)*0.5 + 0.5, Math.sin(rotYAngle*1.7)*0.5 + 0.5*/);
    gl.uniform1f(this.currentProgram.getUniform("mouseDownUniform"), mouseDown ? -1 : 1);  
    
    this.FB.bindFBAndAttachTex(gl, this.texVel);
    this.FBparticlesModel.drawOnFBMulti(gl, this.FB, this.texVel, this.texCurrentPos);
}

View.prototype.updatePositions = function (gl) {
	this.currentProgram = this.scripts.getProgram("updatePosParticleShader").useProgram(gl);
    
    gl.uniform1f(this.currentProgram.getUniform("timeUniform"), this.deltaTime);

    this.FB.bindFBAndAttachTex(gl, this.texCurrentPos);
    this.FBparticlesModel.drawOnFBMulti(gl, this.FB, this.texCurrentPos, this.texVel);
}

View.prototype.drawInitialTextures = function (gl) {
	this.currentProgram = this.scripts.getProgram("initialParticleShader").useProgram(gl);
	
	//Initialize position texture:
	//var elapsedFromStart = (timeNow - startTime)*0.001;
	gl.uniform2f(this.currentProgram.getUniform("offsetUniform"), -0.5, -0.5);
	gl.uniform1f(this.currentProgram.getUniform("multiplierUniform"), 1.0);
	gl.uniform1f(this.currentProgram.getUniform("correctionUniform"), 0.45);
	
	gl.activeTexture(gl.TEXTURE0);
	this.FB.bindFBAndAttachTex(gl, this.texCurrentPos);
	
	this.FBparticlesModel.drawOnFB(gl, this.FB);
	
	///

	//Initialize velocity texture:
	gl.uniform2f(this.currentProgram.getUniform("offsetUniform"), -.5 , -0.5);
	gl.uniform1f(this.currentProgram.getUniform("multiplierUniform"), 0.1);
	gl.uniform1f(this.currentProgram.getUniform("correctionUniform"), 0.45);
	
	gl.activeTexture(gl.TEXTURE1);
	this.FB.bindFBAndAttachTex(gl, this.texVel);

	this.FBparticlesModel.drawOnFB(gl, this.FB);
	
	gl.activeTexture(gl.TEXTURE0);
	this.first = false;
}

//Setup functions:
View.prototype.setupShowBillboardShader = function (gl) {
	this.currentProgram = this.scripts.getProgram("showBillboardShader").useProgram(gl);
	
	gl.activeTexture(gl.TEXTURE0);
	gl.uniform1i(this.currentProgram.getUniform("posUniform"), 0);
	
	gl.activeTexture(gl.TEXTURE2);
	gl.uniform1i(this.currentProgram.getUniform("billUniform"), 2);
	
	gl.activeTexture(gl.TEXTURE0);
	
	this.setMVMatrixUniforms(gl);
	this.setPMatrixUniform(gl);
	
	this.showParticlesModel = new GLShowParticles(gl, 2, this);
	this.showParticlesModel.generateParticlesAndBuffer(gl, this.numPointsSqrt, this.texCurrentPos);
}

View.prototype.setupUpdatePosShader = function (gl) {
	this.currentProgram = this.scripts.getProgram("updatePosParticleShader").useProgram(gl);
	
	gl.activeTexture(gl.TEXTURE0);
	gl.uniform1i(this.currentProgram.getUniform("currentPosUniform"), 0);
	
	gl.activeTexture(gl.TEXTURE1);
	gl.uniform1i(this.currentProgram.getUniform("currentVelUniform"), 1);
	
	gl.activeTexture(gl.TEXTURE0);
}

View.prototype.setupUpdateVelShader = function (gl) {
	this.currentProgram = this.scripts.getProgram("updateVelParticleShader").useProgram(gl);
	
	gl.activeTexture(gl.TEXTURE0);
	gl.uniform1i(this.currentProgram.getUniform("currentVelUniform"), 0);
	
	gl.activeTexture(gl.TEXTURE1);
	gl.uniform1i(this.currentProgram.getUniform("currentPosUniform"), 1);
	
	gl.activeTexture(gl.TEXTURE0);
}

View.prototype.setupFBAndInitTextures = function (gl) {
	this.FBparticlesModel = new GLFBParticles(gl, 1, this);
	this.FBparticlesModel.createQuadAndSetup(gl);
	
	this.FB = new FBO(gl, this.numPointsSqrt);
	gl.activeTexture(gl.TEXTURE1);
	this.texVel = createAndSetupTexture(gl, this.FB.widthFB, this.FB.heightFB);
	//this.FB.bindFBAndAttachTex(gl, this.texVel);
	
	//this.FBPos = new FBO(gl, this.numPointsSqrt);
	gl.activeTexture(gl.TEXTURE0);
	this.texCurrentPos = createAndSetupTexture(gl, this.FB.widthFB, this.FB.heightFB);
	//this.FBPos.bindFBAndAttachTex(gl, this.texPos);
	
	gl.activeTexture(gl.TEXTURE0);
}

View.prototype.setupPhongShader = function (gl) {
	this.currentProgram = this.scripts.getProgram("phongShader").useProgram(gl);
	gl.uniform3f(this.currentProgram.getUniform("lightingPositionUniform"), 0, 0, 0);
	this.setMVMatrixUniforms(gl);
	this.setPMatrixUniform(gl);
	this.setNormalUniforms(gl); 
	
	this.cubeModel = new GLObject(gl, this);
	
	var objectLoader = new FileLoader(1, startTicking, this); 
	loadMesh(gl, this.cubeModel, "/ParticleSystem/ParticleSystem/Resources/x-models/cube1.ctm", objectLoader);
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

View.prototype.loadTextures = function(thisClass) {
	thisClass.cubeTex = new Texture();
	thisClass.smokeTex = new Texture();

	var objectLoader = new FileLoader(2, thisClass.setupShadersAndObjects, thisClass); 
	loadImageToTex(thisClass.gl, thisClass.cubeTex, "/ParticleSystem/ParticleSystem/Resources/x-images/red.png", objectLoader);
	loadImageToTex(thisClass.gl, thisClass.smokeTex, "/ParticleSystem/ParticleSystem/Resources/x-images/smoke.png", objectLoader);
}