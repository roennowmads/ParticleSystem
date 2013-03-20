"use strict";

function View () {
	this.canvas;
	this.gl;
	this.cubeModel, this.planeModel, this.FBparticlesModel, this.showParticlesModel;
	this.cubeTex, this.planeTex;
	this.rotYAngle = 0;

	this.showParticleVScriptObj, this.showParticleFScriptObj;
	this.FBTextureVScriptObj;
	this.initialParticleFScriptObj;
	this.updateParticleFScriptObj;
	this.pdateVelParticleFScriptObj;
	this.updatePosParticleFScriptObj;

	this.phongVScriptObj, this.phongFScriptObj;

	this.currentProgram; 
	this.showParticleShader, this.initialParticleShader;
	this.updateParticleShader, this.updateVelParticleShader;
	this.updatePosParticleShader, this.phongShader;

	this.DRAWTARGETS = { CANVAS : 0, FRAMEBUFFER : 1 };

	this.lastGLObject;
	this.lastDrawTarget; 
	this.currentTexture;

	this.numPointsSqrt = 800;
	this.numPoints = this.numPointsSqrt*this.numPointsSqrt;

	this.FB;

	this.texPos, this.texVel;
	this.texCurrentPos, this.texAccel;

	this.zoomFactor = 0.125;
	
	this.first = true;
}

View.prototype.initView = function () {
	this.canvas = document.getElementById("canvas");
	this.gl = initGL(this.canvas);
	var float_texture_ext = this.gl.getExtension('OES_texture_float');
	if (!float_texture_ext)
		alert("OES_texture_float extension is not available!");
	
	this.FBTextureVScriptObj = new ScriptObject();
	this.initialParticleFScriptObj = new ScriptObject();
	this.showParticleVScriptObj = new ScriptObject();
	this.showParticleFScriptObj = new ScriptObject();
	this.updateParticleFScriptObj = new ScriptObject();
	this.updateVelParticleFScriptObj = new ScriptObject();
	this.updatePosParticleFScriptObj = new ScriptObject();
	
	this.phongVScriptObj = new ScriptObject();
	this.phongFScriptObj = new ScriptObject();
	
	//Loads shaders, and calls setupShadersAndObjects when done:
	var objectLoader = new FileLoader(9, this.setupShadersAndObjects, this); 
	loadShaderScript(this.FBTextureVScriptObj, "Resources/Shaderfiles/FBTextureVShader.c", objectLoader);
	loadShaderScript(this.initialParticleFScriptObj, "Resources/Shaderfiles/initialParticleFShader.c", objectLoader);
	loadShaderScript(this.showParticleVScriptObj, "Resources/Shaderfiles/showParticleVShader.c", objectLoader);
	loadShaderScript(this.showParticleFScriptObj, "Resources/Shaderfiles/showParticleFShader.c", objectLoader);
	loadShaderScript(this.updateParticleFScriptObj, "Resources/Shaderfiles/updateParticleFShader.c", objectLoader);
	loadShaderScript(this.updateVelParticleFScriptObj, "Resources/Shaderfiles/updateVelParticleFShader.c", objectLoader);
	loadShaderScript(this.updatePosParticleFScriptObj, "Resources/Shaderfiles/updatePosParticleFShader.c", objectLoader);
	loadShaderScript(this.phongVScriptObj, "Resources/Shaderfiles/phongVShader.c", objectLoader);
	loadShaderScript(this.phongFScriptObj, "Resources/Shaderfiles/phongFShader.c", objectLoader);
}

View.prototype.setupShadersAndObjects = function (thisClass) {	
	thisClass.showParticleShader = new Shader(thisClass.gl, thisClass.showParticleFScriptObj.script, thisClass.showParticleVScriptObj.script);
	thisClass.initialParticleShader = new Shader(thisClass.gl, thisClass.initialParticleFScriptObj.script, thisClass.FBTextureVScriptObj.script);
	thisClass.updateParticleShader = new Shader(thisClass.gl, thisClass.updateParticleFScriptObj.script, thisClass.FBTextureVScriptObj.script);
	thisClass.updateVelParticleShader = new Shader(thisClass.gl, thisClass.updateVelParticleFScriptObj.script, thisClass.FBTextureVScriptObj.script);
	thisClass.updatePosParticleShader = new Shader(thisClass.gl, thisClass.updatePosParticleFScriptObj.script, thisClass.FBTextureVScriptObj.script);
	thisClass.phongShader = new Shader(thisClass.gl, thisClass.phongFScriptObj.script, thisClass.phongVScriptObj.script);
	
	thisClass.setupCanvas(thisClass.gl);
	
	//setupParticleShader(gl, updateParticleShader);
	thisClass.setupUpdateVelShader(thisClass.gl);
	thisClass.setupUpdatePosShader(thisClass.gl);
	thisClass.setupFBAndInitTextures(thisClass.gl);
	thisClass.setupShowParticleShader(thisClass.gl);
	thisClass.setupPhongShader(thisClass.gl);
	
	//startTicking();
}

View.prototype.animate = function () {
	timeNow = Date.now();
	var elapsed = timeNow - timeLast;
    var delta = 0.001 * elapsed;
	this.rotYAngle += delta;
		
	timeLast = timeNow;
}

View.prototype.draw = function () {
	//Clear the screen:
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    
    mat4.identity(mvMatrix);

    mat4.translate(mvMatrix, [0, 0, -100.5]);
    var quatY = quat4.fromAngleAxis(0*Math.PI/2, [1,0,0]);
	var quatX = quat4.fromAngleAxis(0*this.rotYAngle, [0,0,1]);
	var quatRes = quat4.multiply(quatX, quatY);
	var rotMatrix = quat4.toMat4(quatRes);
	mat4.multiply(mvMatrix, rotMatrix);
    
    if (this.first) 
    	this.drawInitialTextures(this.gl);
    
    var elapsedFromStart = (timeNow - startTime)*0.001;
    
    //Update velocities:
    this.updateVelocities(this.gl);
    
    //Update positions:
    this.updatePositions(this.gl);
    
    //Draw on canvas:
    this.drawParticles(this.gl); 
    
    //mat4.translate(mvMatrix, [0, 10, -10]);
    //drawParticles(gl); 
    
    //gl.activeTexture(gl.TEXTURE0);
    /*
    //Draw cube:
    mat4.scale(mvMatrix, [.5, .5, .5]);
    
    var quatY = quat4.fromAngleAxis(rotYAngle/3, [1,0,0]);
	var quatX = quat4.fromAngleAxis(rotYAngle, [0,1,0]);
	var quatRes = quat4.multiply(quatX, quatY);
	var rotMatrix = quat4.toMat4(quatRes);
	mat4.multiply(mvMatrix, rotMatrix);
    
	mvPushMatrix();
		mat4.translate(mvMatrix, [-1, -1, -1]);
		mat4.scale(mvMatrix, [.5, .5, .5]);
	    drawParticles(gl);
    mvPopMatrix();
    
    mvPushMatrix();
		mat4.translate(mvMatrix, [1, -1, -1]);
		mat4.scale(mvMatrix, [.5, .5, .5]);
		drawParticles(gl);
    mvPopMatrix();
    
    mvPushMatrix();
		mat4.translate(mvMatrix, [1, 1, -1]);
		mat4.scale(mvMatrix, [.5, .5, .5]);
		drawParticles(gl);
	mvPopMatrix();

	mvPushMatrix();
		mat4.translate(mvMatrix, [1, 1, 1]);
		mat4.scale(mvMatrix, [.5, .5, .5]);
		drawParticles(gl);
	mvPopMatrix();
	
	mvPushMatrix();
		mat4.translate(mvMatrix, [-1, -1, 1]);
		mat4.scale(mvMatrix, [.5, .5, .5]);
	    drawParticles(gl);
	mvPopMatrix();
	
	mvPushMatrix();
		mat4.translate(mvMatrix, [-1, 1, 1]);
		mat4.scale(mvMatrix, [.5, .5, .5]);
		drawParticles(gl);
	mvPopMatrix();
	
	mvPushMatrix();
		mat4.translate(mvMatrix, [-1, 1, -1]);
		mat4.scale(mvMatrix, [.5, .5, .5]);
		drawParticles(gl);
	mvPopMatrix();
	
	mvPushMatrix();
		mat4.translate(mvMatrix, [1, -1, 1]);
		mat4.scale(mvMatrix, [.5, .5, .5]);
		drawParticles(gl);
	mvPopMatrix();
	
	//gl.enable(gl.BLEND);
    currentProgram = phongShader.useProgram(gl);
    cubeModel.texture = cubeTex.texture;
    cubeModel.draw(gl);
    //gl.disable(gl.BLEND);
    */
   
}

View.prototype.setupCanvas = function (gl) {
	gl.clearColor(0.1, 0.1, 0.2, 1.0);
	//gl.enable(gl.DEPTH_TEST);
	//gl.enable(gl.BLEND);
	//gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	//gl.frontFace(gl.CCW);
	//gl.enable(gl.CULL_FACE);
	//gl.cullFace(gl.BACK);
	
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

View.prototype.drawParticles = function (gl) {
	this.currentProgram = this.showParticleShader.useProgram(gl);
	mvPushMatrix();
	    mat4.translate(mvMatrix, [0, 0, 1]);
	    
		this.showParticlesModel.texture = this.texCurrentPos;
		//gl.activeTexture(gl.TEXTURE0);
		
	    this.showParticlesModel.draw(gl);
    mvPopMatrix();
}

View.prototype.updateVelocities = function (gl) {
	this.currentProgram = this.updateVelParticleShader.useProgram(gl);
    
    //gl.uniform1f(currentProgram.getUniform("timeUniform"), elapsedFromStart);
    gl.uniform2f(this.currentProgram.getUniform("mousePosUniform"), /*0.5,0.5*/mouseX*2.1/gl.viewportWidth - 0.55, 1 - mouseY*1.5/gl.viewportHeight + 0.25 /*Math.cos(rotYAngle*1.7)*0.5 + 0.5, Math.sin(rotYAngle*1.7)*0.5 + 0.5*/);
    gl.uniform1i(this.currentProgram.getUniform("mouseDownUniform"), mouseDown);  
    
    this.FB.bindFBAndAttachTex(gl, this.texVel, this.FB.FB);
    this.FBparticlesModel.drawOnFBMulti(gl, this.FB, this.texVel, this.texCurrentPos);
}

View.prototype.updatePositions = function (gl) {
	this.currentProgram = this.updatePosParticleShader.useProgram(gl);
    
    //gl.uniform1f(currentProgram.getUniform("timeUniform"), elapsedFromStart);
	
    this.FB.bindFBAndAttachTex(gl, this.texCurrentPos, this.FB.FB);
    this.FBparticlesModel.drawOnFBMulti(gl, this.FB, this.texCurrentPos, this.texVel);
}

View.prototype.drawInitialTextures = function (gl) {
	this.currentProgram = this.initialParticleShader.useProgram(gl);
	
	//Initialize position texture:
	var elapsedFromStart = (timeNow - startTime)*0.001;
	gl.uniform2f(this.currentProgram.getUniform("offsetUniform"), -0.5, 0.5);
	gl.uniform1f(this.currentProgram.getUniform("multiplierUniform"), 0.1);
	gl.uniform1f(this.currentProgram.getUniform("correctionUniform"), 0.45);
	
	gl.activeTexture(gl.TEXTURE0);
	this.FB.bindFBAndAttachTex(gl, this.texCurrentPos, this.FB.FB);
	
	this.FBparticlesModel.drawOnFB(gl, this.FB);
	
	///

	//Initialize velocity texture:
	gl.uniform2f(this.currentProgram.getUniform("offsetUniform"), -.5 , -0.5);
	gl.uniform1f(this.currentProgram.getUniform("multiplierUniform"), 0.1);
	gl.uniform1f(this.currentProgram.getUniform("correctionUniform"), 0.45);
	
	gl.activeTexture(gl.TEXTURE1);
	this.FB.bindFBAndAttachTex(gl, this.texVel, this.FB.FB);

	this.FBparticlesModel.drawOnFB(gl, this.FB);
	
	gl.activeTexture(gl.TEXTURE0);
	this.first = false;
}

View.prototype.setupUpdatePosShader = function (gl) {
	this.currentProgram = this.updatePosParticleShader.useProgram(gl);
	
	gl.activeTexture(gl.TEXTURE0);
	gl.uniform1i(this.currentProgram.getUniform("currentPosUniform"), 0);
	
	gl.activeTexture(gl.TEXTURE1);
	gl.uniform1i(this.currentProgram.getUniform("currentVelUniform"), 1);
	
	gl.activeTexture(gl.TEXTURE0);
}

View.prototype.setupUpdateVelShader = function (gl) {
	this.currentProgram = this.updateVelParticleShader.useProgram(gl);
	
	gl.activeTexture(gl.TEXTURE0);
	gl.uniform1i(this.currentProgram.getUniform("currentVelUniform"), 0);
	
	gl.activeTexture(gl.TEXTURE1);
	gl.uniform1i(this.currentProgram.getUniform("currentPosUniform"), 1);
	
	gl.activeTexture(gl.TEXTURE0);
}

function setupParticleShader (gl, shaderProgram) {
	this.currentProgram = shaderProgram.useProgram(gl);
	
	gl.activeTexture(gl.TEXTURE0);
	gl.uniform1i(this.currentProgram.getUniform("currentUniform"), 0);
	
	gl.activeTexture(gl.TEXTURE1);
	gl.uniform1i(this.currentProgram.getUniform("deltaUniform"), 1);
	
	gl.activeTexture(gl.TEXTURE0);
}

View.prototype.setupFBAndInitTextures = function (gl) {
	this.FBparticlesModel = new GLFBParticles(gl, 1, this);
	this.FBparticlesModel.createQuadAndSetup(gl);
	
	this.FB = new FBO(gl, this.numPointsSqrt);
	gl.activeTexture(gl.TEXTURE1);
	this.texVel = createAndSetupTexture(gl, this.FB.widthFB, this.FB.heightFB);
	gl.activeTexture(gl.TEXTURE0);
	this.texCurrentPos = createAndSetupTexture(gl, this.FB.widthFB, this.FB.heightFB);
	
	gl.activeTexture(gl.TEXTURE0);
}

View.prototype.setupShowParticleShader = function (gl) {
	this.currentProgram = this.showParticleShader.useProgram(gl);
	
	this.setMVMatrixUniforms(gl);
	this.setPMatrixUniform(gl);
	
	this.showParticlesModel = new GLShowParticles(gl, 2, this);
	this.showParticlesModel.generateParticlesAndBuffer(gl, this.numPointsSqrt, this.texPos);
}

View.prototype.setupPhongShader = function (gl) {
	this.currentProgram = this.phongShader.useProgram(gl);
	gl.uniform3f(this.currentProgram.getUniform("lightingPositionUniform"), 0, 0, 0);
	this.setMVMatrixUniforms(gl);
	this.setPMatrixUniform(gl);
	this.setNormalUniforms(gl); 
	
	this.cubeModel = new GLObject(gl, this);
	this.cubeTex = new Texture();
	
	var objectLoader = new FileLoader(2, startTicking, this); 
	loadImageToTex(gl, this.cubeTex, "/ParticleSystem/ParticleSystem/Resources/x-images/red.png", objectLoader);
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