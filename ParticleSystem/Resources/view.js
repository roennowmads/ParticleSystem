"use strict";

var canvas;
var gl;
var cubeModel, planeModel, FBparticlesModel, showParticlesModel;
var cubeTex, planeTex;
var rotYAngle = 0;

var showParticleVScriptObj, showParticleFScriptObj;
var FBTextureVScriptObj;
var initialParticleFScriptObj;
var updateParticleFScriptObj;
var updateVelParticleFScriptObj;
var updatePosParticleFScriptObj;

var phongVScriptObj, phongFScriptObj;

var currentProgram; 
var showParticleShader, initialParticleShader, updateParticleShader, updateVelParticleShader, updatePosParticleShader, phongShader;

var DRAWTARGETS = { CANVAS : 0, FRAMEBUFFER : 1 };

var lastGLObject;
var lastDrawTarget; 
var currentTexture;

var numPointsSqrt = 800;
var numPoints = numPointsSqrt*numPointsSqrt;

var FB;

var texPos, texVel;
var texCurrentPos, texAccel;

var zoomFactor = 0.125;

function initView () {
	canvas = document.getElementById("canvas");
	gl = initGL(canvas);
	var float_texture_ext = gl.getExtension('OES_texture_float');
	if (!float_texture_ext)
		alert("OES_texture_float extension is not available!");
	
	FBTextureVScriptObj = new ScriptObject();
	initialParticleFScriptObj = new ScriptObject();
	showParticleVScriptObj = new ScriptObject();
	showParticleFScriptObj = new ScriptObject();
	updateParticleFScriptObj = new ScriptObject();
	updateVelParticleFScriptObj = new ScriptObject();
	updatePosParticleFScriptObj = new ScriptObject();
	
	phongVScriptObj = new ScriptObject();
	phongFScriptObj = new ScriptObject();
	
	//Loads shaders, and calls setupShadersAndObjects when done:
	var objectLoader = new FileLoader(9, setupShadersAndObjects); 
	loadShaderScript(FBTextureVScriptObj, "Resources/Shaderfiles/FBTextureVShader.c", objectLoader);
	loadShaderScript(initialParticleFScriptObj, "Resources/Shaderfiles/initialParticleFShader.c", objectLoader);
	loadShaderScript(showParticleVScriptObj, "Resources/Shaderfiles/showParticleVShader.c", objectLoader);
	loadShaderScript(showParticleFScriptObj, "Resources/Shaderfiles/showParticleFShader.c", objectLoader);
	loadShaderScript(updateParticleFScriptObj, "Resources/Shaderfiles/updateParticleFShader.c", objectLoader);
	loadShaderScript(updateVelParticleFScriptObj, "Resources/Shaderfiles/updateVelParticleFShader.c", objectLoader);
	loadShaderScript(updatePosParticleFScriptObj, "Resources/Shaderfiles/updatePosParticleFShader.c", objectLoader);
	loadShaderScript(phongVScriptObj, "Resources/Shaderfiles/phongVShader.c", objectLoader);
	loadShaderScript(phongFScriptObj, "Resources/Shaderfiles/phongFShader.c", objectLoader);
}

function setupShadersAndObjects() {		
	showParticleShader = new Shader(gl, showParticleFScriptObj.script, showParticleVScriptObj.script);
	initialParticleShader = new Shader(gl, initialParticleFScriptObj.script, FBTextureVScriptObj.script);
	updateParticleShader = new Shader(gl, updateParticleFScriptObj.script, FBTextureVScriptObj.script);
	updateVelParticleShader = new Shader(gl, updateVelParticleFScriptObj.script, FBTextureVScriptObj.script);
	updatePosParticleShader = new Shader(gl, updatePosParticleFScriptObj.script, FBTextureVScriptObj.script);
	phongShader = new Shader(gl, phongFScriptObj.script, phongVScriptObj.script);
	
	setupCanvas(gl);
	
	//setupParticleShader(gl, updateParticleShader);
	setupUpdateVelShader(gl);
	setupUpdatePosShader(gl);
	setupFBAndInitTextures(gl);
	setupShowParticleShader(gl);
	setupPhongShader(gl);
	
	//startTicking();
}

function animate () {
	timeNow = Date.now();
	var elapsed = timeNow - timeLast;
    var delta = 0.001 * elapsed;
	rotYAngle += delta;
		
	timeLast = timeNow;
}

var first = true;

function draw () {
	//Clear the screen:
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    mat4.identity(mvMatrix);

    mat4.translate(mvMatrix, [0, 0, -100.5]);
    var quatY = quat4.fromAngleAxis(0*Math.PI/2, [1,0,0]);
	var quatX = quat4.fromAngleAxis(0*rotYAngle, [0,0,1]);
	var quatRes = quat4.multiply(quatX, quatY);
	var rotMatrix = quat4.toMat4(quatRes);
	mat4.multiply(mvMatrix, rotMatrix);
    
    if (first) 
    	drawInitialTextures(gl);
    
    var elapsedFromStart = (timeNow - startTime)*0.001;
    
    //Update velocities:
    updateVelocities(gl);
    
    //Update positions:
    updatePositions(gl);
    
    //Draw on canvas:
    drawParticles(gl); 
    
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

function setupCanvas (gl) {
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

function tick() {
	draw();
	animate();
	logFrameRate();
	requestAnimFrame(tick);
}

function startTicking() {
	tick();
}

function drawParticles (gl) {
	currentProgram = showParticleShader.useProgram(gl);
	mvPushMatrix();
	    mat4.translate(mvMatrix, [0, 0, 1]);
	    
		showParticlesModel.texture = texCurrentPos;
		//gl.activeTexture(gl.TEXTURE0);
		
	    showParticlesModel.draw(gl);
    mvPopMatrix();
}

function updateVelocities (gl) {
	currentProgram = updateVelParticleShader.useProgram(gl);
    
    //gl.uniform1f(currentProgram.getUniform("timeUniform"), elapsedFromStart);
    gl.uniform2f(currentProgram.getUniform("mousePosUniform"), /*0.5,0.5*/mouseX*2.1/gl.viewportWidth - 0.55, 1 - mouseY*1.5/gl.viewportHeight + 0.25 /*Math.cos(rotYAngle*1.7)*0.5 + 0.5, Math.sin(rotYAngle*1.7)*0.5 + 0.5*/);
    gl.uniform1i(currentProgram.getUniform("mouseDownUniform"), mouseDown);  
    
    FB.bindFBAndAttachTex(gl, texVel, FB.FB);
    FBparticlesModel.drawOnFBMulti(gl, FB, texVel, texCurrentPos);
}

function updatePositions (gl) {
	currentProgram = updatePosParticleShader.useProgram(gl);
    
    //gl.uniform1f(currentProgram.getUniform("timeUniform"), elapsedFromStart);
	
    FB.bindFBAndAttachTex(gl, texCurrentPos, FB.FB);
    FBparticlesModel.drawOnFBMulti(gl, FB, texCurrentPos, texVel);
}

function drawInitialTextures (gl) {
	currentProgram = initialParticleShader.useProgram(gl);
	
	//Initialize position texture:
	var elapsedFromStart = (timeNow - startTime)*0.001;
	gl.uniform2f(currentProgram.getUniform("offsetUniform"), -0.5, 0.5);
	gl.uniform1f(currentProgram.getUniform("multiplierUniform"), 0.1);
	gl.uniform1f(currentProgram.getUniform("correctionUniform"), 0.45);
	
	gl.activeTexture(gl.TEXTURE0);
	FB.bindFBAndAttachTex(gl, texCurrentPos, FB.FB);
	
	FBparticlesModel.drawOnFB(gl, FB);
	
	///

	//Initialize velocity texture:
	gl.uniform2f(currentProgram.getUniform("offsetUniform"), -.5 , -0.5);
	gl.uniform1f(currentProgram.getUniform("multiplierUniform"), 0.1);
	gl.uniform1f(currentProgram.getUniform("correctionUniform"), 0.45);
	
	gl.activeTexture(gl.TEXTURE1);
	FB.bindFBAndAttachTex(gl, texVel, FB.FB);

	FBparticlesModel.drawOnFB(gl, FB);
	
	gl.activeTexture(gl.TEXTURE0);
	first = false;
}

function setupUpdatePosShader (gl) {
	currentProgram = updatePosParticleShader.useProgram(gl);
	
	gl.activeTexture(gl.TEXTURE0);
	gl.uniform1i(currentProgram.getUniform("currentPosUniform"), 0);
	
	gl.activeTexture(gl.TEXTURE1);
	gl.uniform1i(currentProgram.getUniform("currentVelUniform"), 1);
	
	gl.activeTexture(gl.TEXTURE0);
}

function setupUpdateVelShader (gl) {
	currentProgram = updateVelParticleShader.useProgram(gl);
	
	gl.activeTexture(gl.TEXTURE0);
	gl.uniform1i(currentProgram.getUniform("currentVelUniform"), 0);
	
	gl.activeTexture(gl.TEXTURE1);
	gl.uniform1i(currentProgram.getUniform("currentPosUniform"), 1);
	
	gl.activeTexture(gl.TEXTURE0);
}

function setupParticleShader (gl, shaderProgram) {
	currentProgram = shaderProgram.useProgram(gl);
	
	gl.activeTexture(gl.TEXTURE0);
	gl.uniform1i(currentProgram.getUniform("currentUniform"), 0);
	
	gl.activeTexture(gl.TEXTURE1);
	gl.uniform1i(currentProgram.getUniform("deltaUniform"), 1);
	
	gl.activeTexture(gl.TEXTURE0);
}

function setupFBAndInitTextures (gl) {
	FBparticlesModel = new GLFBParticles(gl, 1);
	FBparticlesModel.createQuadAndSetup(gl);
	
	FB = new FBO(gl, numPointsSqrt);
	gl.activeTexture(gl.TEXTURE1);
	texVel = createAndSetupTexture(gl, FB.widthFB, FB.heightFB);
	gl.activeTexture(gl.TEXTURE0);
	texCurrentPos = createAndSetupTexture(gl, FB.widthFB, FB.heightFB);
	
	gl.activeTexture(gl.TEXTURE0);
}

function setupShowParticleShader (gl) {
	currentProgram = showParticleShader.useProgram(gl);
	
	setMVMatrixUniforms(gl);
	setPMatrixUniform(gl);
	
	showParticlesModel = new GLShowParticles(gl, 2);
	showParticlesModel.generateParticlesAndBuffer(gl, numPoints, texPos);
}

function setupPhongShader (gl) {
	currentProgram = phongShader.useProgram(gl);
	gl.uniform3f(currentProgram.getUniform("lightingPositionUniform"), 0, 0, 0);
	setMVMatrixUniforms(gl);
	setPMatrixUniform(gl);
	setNormalUniforms(gl); 
	
	cubeModel = new GLObject(gl);
	cubeTex = new Texture();
	
	var objectLoader = new FileLoader(2, startTicking); 
	loadImageToTex(cubeTex, "/ParticleSystem/ParticleSystem/Resources/x-images/red.png", objectLoader);
	loadMesh(cubeModel, "/ParticleSystem/ParticleSystem/Resources/x-models/cube1.ctm", objectLoader);
}