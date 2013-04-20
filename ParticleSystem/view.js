"use strict";

function View() {
	this.canvas;
	this.gl;
	this.cubeModel;
	
	this.models = new Array();
	this.textures = new Array();
	this.rightWallMortarTex;
	
	this.planeTex;
	this.rotYAngle = 0;
	this.deltaTime = 0;

	//this.DRAWTARGETS = { CANVAS : 0, FRAMEBUFFER : 1 };

	this.lastGLObject;
	this.lastDrawTarget;

	this.numPointsSqrt = document.getElementById("objectCount").value;
	this.numPoints = this.numPointsSqrt * this.numPointsSqrt;

	this.zoomFactor = 1.0;
	
	this.first = true;
	
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
	this.scripts.addProgram("phongShader", "phong", "phong");
	
	//Downloads scripts and calls loadTextures when done, which calls setupShadersAndObjects when done:
	this.scripts.loadScripts();
}

View.prototype.setupShadersAndObjects = function (thisClass) {	
	thisClass.particles = new Particles(thisClass, thisClass.smokeTex);

	thisClass.setupCanvas(thisClass.gl);
	
	thisClass.particles.setup(thisClass.gl);
	thisClass.setupPhongShader(thisClass.gl);
	thisClass.loadModels(thisClass.gl);
	
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
	
	this.drawHouse(this.gl);
	this.particles.draw(this.gl);
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

View.prototype.drawHouse = function (gl) {
	this.currentProgram = this.scripts.getProgram("phongShader").useProgram(gl);
	
	mvPushMatrix();
		gl.disable(gl.BLEND);
		
		var quatY = quat4.fromAngleAxis(Math.PI/4, [1,0,0]);
		var quatX = quat4.fromAngleAxis(0*this.rotYAngle, [0,1,0]);
		var quatRes = quat4.multiply(quatX, quatY);
		var rotMatrix = quat4.toMat4(quatRes);
		mat4.multiply(mvMatrix, rotMatrix);
		
		mat4.scale(mvMatrix, [this.zoomFactor, this.zoomFactor, this.zoomFactor]);
		
		mat4.translate(mvMatrix, [0.0,-.5,-2.0]);
		
		var quatY = quat4.fromAngleAxis(0*Math.PI/4, [1,0,0]);
		var quatX = quat4.fromAngleAxis(this.rotYAngle, [0,1,0]);
		var quatRes = quat4.multiply(quatX, quatY);
		var rotMatrix = quat4.toMat4(quatRes);
		mat4.multiply(mvMatrix, rotMatrix);
		
		//Ground:
		mvPushMatrix();
			mat4.translate(mvMatrix, [0.0,-.16,0.0]);
			mat4.scale(mvMatrix, [3, 0.05, 3]);
			this.cubeModel.texture = this.rightWallMortarTex.texture;
			this.cubeModel.draw(gl);
		mvPopMatrix();
		
		mat4.scale(mvMatrix, [.001, .001, .001]);
		
		for (var i = 0; i < this.models.length; i++) {
			var j = i;
			if (i > 6)
				j--;
			if (this.textures[i]) {
				this.models[i].texture = this.textures[j].texture;	
			}
			this.models[i].draw(gl);
		}
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

View.prototype.loadModels = function (gl) {
	this.cubeModel = new GLObject(gl, this);
	
	this.door = new GLObject(gl, this);
	this.doorHandle = new GLObject(gl, this);
	this.frontWallLogs = new GLObject(gl, this);
	this.backWall = new GLObject(gl, this);
	this.insideCottage = new GLObject(gl, this);
	this.interiorFloor = new GLObject(gl, this);
	this.leftWallLogs = new GLObject(gl, this);
	this.rightWallMortar = new GLObject(gl, this);
	this.patio = new GLObject(gl, this);
	this.pillars = new GLObject(gl, this);
	this.rightWallLogs = new GLObject(gl, this);
	this.roofPanel1 = new GLObject(gl, this);
	this.roofPanel2 = new GLObject(gl, this);
	this.roofAccessories = new GLObject(gl, this);
	this.upperWall = new GLObject(gl, this);
	this.upperWallBack = new GLObject(gl, this);
	//this.windowFrames = new GLObject(gl, this);
	//this.windows = new GLObject(gl, this);
	
	this.models.push(this.leftWallLogs, this.frontWallLogs, this.rightWallLogs, /*this.rightWallMortar,*/ this.backWall, 
	this.upperWall, this.upperWallBack, this.roofPanel1, this.roofPanel2, this.roofAccessories, this.pillars, this.patio, 
	this.door/*, this.windowFrames, this.windows*//*, this.interiorFloor*/); 
	
	var objectLoader = new FileLoader(13, startTicking, this); 
	loadMesh(gl, this.door, "/ParticleSystem/ParticleSystem/Resources/x-models/door.ctm", objectLoader);
	//loadMesh(gl, this.interiorFloor, "/ParticleSystem/ParticleSystem/Resources/x-models/insideFloor.ctm", objectLoader);
	//loadMesh(gl, this.rightWallMortar, "/ParticleSystem/ParticleSystem/Resources/x-models/rightWallMortar.ctm", objectLoader);
	loadMesh(gl, this.frontWallLogs, "/ParticleSystem/ParticleSystem/Resources/x-models/frontWall.ctm", objectLoader);
	loadMesh(gl, this.backWall, "/ParticleSystem/ParticleSystem/Resources/x-models/backWall.ctm", objectLoader);
	loadMesh(gl, this.leftWallLogs, "/ParticleSystem/ParticleSystem/Resources/x-models/leftWall.ctm", objectLoader);
	loadMesh(gl, this.patio, "/ParticleSystem/ParticleSystem/Resources/x-models/patio.ctm", objectLoader);
	loadMesh(gl, this.pillars, "/ParticleSystem/ParticleSystem/Resources/x-models/pillars.ctm", objectLoader);
	loadMesh(gl, this.rightWallLogs, "/ParticleSystem/ParticleSystem/Resources/x-models/rightWallFull.ctm", objectLoader);
	loadMesh(gl, this.roofPanel1, "/ParticleSystem/ParticleSystem/Resources/x-models/roofPanel.ctm", objectLoader);
	loadMesh(gl, this.roofPanel2, "/ParticleSystem/ParticleSystem/Resources/x-models/roofPanel2.ctm", objectLoader);
	loadMesh(gl, this.roofAccessories, "/ParticleSystem/ParticleSystem/Resources/x-models/roofAccessories.ctm", objectLoader);
	loadMesh(gl, this.upperWall, "/ParticleSystem/ParticleSystem/Resources/x-models/frontRoofWall.ctm", objectLoader);
	loadMesh(gl, this.upperWallBack, "/ParticleSystem/ParticleSystem/Resources/x-models/backRoofWall.ctm", objectLoader);
	//loadMesh(gl, this.windowFrames, "/ParticleSystem/ParticleSystem/Resources/x-models/windowFrames.ctm", objectLoader);
	//loadMesh(gl, this.windows, "/ParticleSystem/ParticleSystem/Resources/x-models/windows.ctm", objectLoader);
	
	loadMesh(gl, this.cubeModel, "/ParticleSystem/ParticleSystem/Resources/x-models/cube1.ctm", objectLoader);
}

View.prototype.loadTextures = function(thisClass) {
	thisClass.cubeTex = new Texture();
	thisClass.smokeTex = new Texture();
	thisClass.leftWallTex = new Texture();
	thisClass.frontWallTex = new Texture();
	thisClass.rightWallTex = new Texture();
	thisClass.rightWallMortarTex = new Texture();
	thisClass.backWallTex = new Texture();
	thisClass.upperWallTex = new Texture();
	thisClass.upperWallBackTex = new Texture();
	thisClass.roofTex = new Texture();
	thisClass.roofAccessoriesTex = new Texture();
	thisClass.pillarsTex = new Texture();
	thisClass.patioTex = new Texture();
	thisClass.doorTex = new Texture();
	//thisClass.windowFramesTex = new Texture();
	//thisClass.windowsTex = new Texture();
	
	thisClass.textures.push(
		thisClass.leftWallTex, 
		thisClass.frontWallTex, 
		thisClass.rightWallTex,
		/*thisClass.rightWallMortarTex,*/
		thisClass.backWallTex,
		thisClass.upperWallTex,
		thisClass.upperWallBackTex,
		thisClass.roofTex,
		thisClass.roofAccessoriesTex,
		thisClass.pillarsTex,
		thisClass.patioTex,
		thisClass.doorTex/*,
		//thisClass.windowFramesTex
		/*thisClass.windowsTex*/
	); 
	
	var objectLoader = new FileLoader(14, thisClass.setupShadersAndObjects, thisClass); 
	loadImageToTex(thisClass.gl, thisClass.leftWallTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/LeftWallLogs_color.jpg", objectLoader);
	loadImageToTex(thisClass.gl, thisClass.frontWallTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/FrontWallLogs_color.jpg", objectLoader);
	loadImageToTex(thisClass.gl, thisClass.rightWallTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/LeftWallLogs_color.jpg", objectLoader);
	loadImageToTex(thisClass.gl, thisClass.rightWallMortarTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/Mortar_color.jpg", objectLoader);
	loadImageToTex(thisClass.gl, thisClass.backWallTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/LeftWallLogs_color.jpg", objectLoader);
	loadImageToTex(thisClass.gl, thisClass.upperWallTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/UpperWall_color.jpg", objectLoader);
	loadImageToTex(thisClass.gl, thisClass.upperWallBackTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/UpperWall_color.jpg", objectLoader);
	loadImageToTex(thisClass.gl, thisClass.roofTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/Roof_color.jpg", objectLoader);
	loadImageToTex(thisClass.gl, thisClass.roofAccessoriesTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/RoofAccessories_color.jpg", objectLoader);
	loadImageToTex(thisClass.gl, thisClass.pillarsTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/Pillars_color.jpg", objectLoader);
	loadImageToTex(thisClass.gl, thisClass.patioTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/Patio_color.jpg", objectLoader);
	loadImageToTex(thisClass.gl, thisClass.doorTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/Door_color.jpg", objectLoader);
	//loadImageToTex(thisClass.gl, thisClass.windowFramesTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/WindowFrames_color.jpg", objectLoader);
	//loadImageToTex(thisClass.gl, thisClass.windowsTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/Windows_color.jpg", objectLoader);
	
	loadImageToTex(thisClass.gl, thisClass.cubeTex, "/ParticleSystem/ParticleSystem/Resources/x-images/red.png", objectLoader, true);
	loadImageToTex(thisClass.gl, thisClass.smokeTex, "/ParticleSystem/ParticleSystem/Resources/x-images/smoke.png", objectLoader, true);
}