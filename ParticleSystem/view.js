"use strict";

function View() {
	this.canvas;
	this.gl;
	
	this.house = new House(this);
	this.groundModel;
	this.groundTex;
	
	this.rotYAngle = 0;
	this.deltaTime = 0;
	this.zoomFactor = 0.8;

	//this.DRAWTARGETS = { CANVAS : 0, FRAMEBUFFER : 1 };

	this.lastGLObject;
	this.lastDrawTarget;

	this.numPointsSqrt = document.getElementById("objectCount").value;
	this.numPoints = this.numPointsSqrt * this.numPointsSqrt;
	
	this.isUpdatingVelocities = true;
	this.isUpdatingPositions = true;
	
	this.scripts;
	this.particles;
	
	this.counter = 0;
}

View.prototype.initView = function () {
	this.canvas = document.getElementById("canvas");
	this.gl = initGL(this.canvas);
	var float_texture_ext = this.gl.getExtension('OES_texture_float');
	if (!float_texture_ext)
		alert("OES_texture_float extension is not available!");
	
	var depth_texture_ext = this.gl.getExtension('WEBGL_depth_texture');
	if (!depth_texture_ext)
		alert("WEBGL_texture_depth extension is not available!");
		
	/*var vao_ext = this.gl.getExtension("OES_vertex_array_object"); 
	if (!vao_ext)
		alert("OES_vertex_array_object extension is not available!"); */
		
	this.scripts = new ShaderScriptLoader(this.gl, this.loadTextures, this);
	this.scripts.addProgram("showBillboardShader", "showBillboard", "showBillboard");
	this.scripts.addProgram("initialParticleShader", "FBTexture", "initialParticle");
	this.scripts.addProgram("updateVelParticleShader", "FBTexture", "updateVelParticle");
	this.scripts.addProgram("updatePosParticleShader", "FBTexture", "updatePosParticle");
	this.scripts.addProgram("renderTextureShader", "FBTexture", "FBTexture");
	this.scripts.addProgram("phongShader", "phong", "phong");
	this.scripts.addProgram("shadowShader", "shadow", "shadow");
	this.scripts.addProgram("phongShadowShader", "phongShadow", "phongShadow");
	
	//Downloads scripts and calls loadTextures when done, which calls setupShadersAndObjects when done:
	this.scripts.loadScripts();
}

View.prototype.setupShadersAndObjects = function (thisClass) {	
	var prevText = document.getElementById("loadingFile");
	if (prevText)
		canvasDiv.removeChild(prevText);

	thisClass.particles = new Particles(thisClass, thisClass.smokeTex, true);
	thisClass.particles2 = new Particles(thisClass, thisClass.house.textures[0], false);
	thisClass.shadowFBinit(thisClass.gl);

	thisClass.setupCanvas(thisClass.gl);
	
	thisClass.particles.setup(thisClass.gl);
	thisClass.particles2.setup(thisClass.gl);
	thisClass.setupPhongShader(thisClass.gl);
	thisClass.setupShadowShader(thisClass.gl);
	thisClass.setupPhongShadowShader(thisClass.gl);
	thisClass.setupRenderTextureShader(thisClass.gl);
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
	
	this.counter++;
}

View.prototype.draw = function () {
	var gl = this.gl;
	//Clear the screen:
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    
    mat4.identity(mMatrix);
	mat4.identity(vMatrix);
	
	mat4.lookAt([2,4,5], [0,0,0], [0,1,0], vMatrix);
	
	mvPushMatrix();
		this.currentProgram = this.scripts.getProgram("shadowShader").useProgram(this.gl);
		
		this.shadowFB.bind(this.gl, this.shadowFB.front);
		this.gl.viewport(0, 0, this.shadowFB.widthFB, this.shadowFB.widthFB);
		this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
		//gl.cullFace(gl.FRONT);
		gl.colorMask(false, false, false, false);
		this.drawHouseAndGroundFromLight(gl);
		gl.colorMask(true, true, true, true);	
		//gl.cullFace(gl.BACK);		
		
		this.currentProgram = this.scripts.getProgram("renderTextureShader").useProgram(this.gl);
		this.shadowFB.unbind(this.gl);
		//this.particles.FBparticlesModel.drawOnFBMulti(this.gl, this.shadowFB, this.shadowFB.texDepth, this.shadowFB.texDepth);
	mvPopMatrix();
	
	//this.currentProgram = this.scripts.getProgram("phongShader").useProgram(this.gl);
	this.currentProgram = this.scripts.getProgram("phongShadowShader").useProgram(this.gl);
	
	this.shadowFB.unbind(this.gl);
	this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
	
	this.gl.activeTexture(this.gl.TEXTURE1);
	this.gl.bindTexture(this.gl.TEXTURE_2D, this.shadowFB.texDepth);
	
	this.drawHouseAndGround(this.gl);
	
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
	
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 1, 30.0, pMatrix);
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
	this.shadowFB = new FBO(gl, 2048, true);
}

View.prototype.drawHouseAndGroundFromLight = function (gl) {
	gl.disable(gl.BLEND);
	
	mat4.lookAt([-2,4,7], [0,0,0], [0,1,0], vLMatrix);
	
	var quatY = quat4.fromAngleAxis(0, [1,0,0]);
	var quatX = quat4.fromAngleAxis(this.counter*0.02, [0,1,0]);
	var quatRes = quat4.multiply(quatX, quatY);
	var rotMatrix = quat4.toMat4(quatRes);
	mat4.multiply(vLMatrix, rotMatrix);
	
	this.gl.uniformMatrix4fv(this.currentProgram.getUniform("vLMatrixUniform"), false, vLMatrix);
	
	//Ground:
	mvPushMatrix();
		mat4.translate(mMatrix, [0.0,-.16,0.0]);
		mat4.scale(mMatrix, [3, 0.05, 3]);
		
		this.groundModel.texture = this.groundTex.texture;
		this.groundModel.draw(gl);
	mvPopMatrix();
	
	mvPushMatrix();	
		var quatY = quat4.fromAngleAxis(this.counter*0.05, [1,0,0]);
		var quatX = quat4.fromAngleAxis(0, [0,1,0]);
		var quatRes = quat4.multiply(quatX, quatY);
		var rotMatrix = quat4.toMat4(quatRes);
		mat4.multiply(mMatrix, rotMatrix);
		
		mat4.translate(mMatrix, [0.0,1.0,0.0]);
		mat4.scale(mMatrix, [0.5, 0.05, 0.5]);
		
		this.groundModel.texture = this.groundTex.texture;
		this.groundModel.draw(gl);
	mvPopMatrix();
	
	mat4.scale(mMatrix, [.001, .001, .001]);
	
	//House
	this.house.draw(gl);
	gl.enable(this.gl.BLEND);
}

View.prototype.drawHouseAndGround = function (gl) {	
	mvPushMatrix();
		gl.disable(gl.BLEND);
		
		var quatY = quat4.fromAngleAxis(0, [1,0,0]);
		var quatX = quat4.fromAngleAxis(-this.counter*0.01, [0,1,0]);
		var quatRes = quat4.multiply(quatX, quatY);
		var rotMatrix = quat4.toMat4(quatRes);
		mat4.multiply(vMatrix, rotMatrix);
		
		this.gl.uniformMatrix4fv(this.currentProgram.getUniform("vLMatrixUniform"), false, vLMatrix);
		//Ground:
		mvPushMatrix();		
			mat4.translate(mMatrix, [0.0,-.16,0.0]);
			mat4.scale(mMatrix, [3, 0.05, 3]);
			this.groundModel.texture = this.groundTex.texture;
			this.groundModel.draw(gl);
		mvPopMatrix();
		
		mvPushMatrix();		
			var quatY = quat4.fromAngleAxis(this.counter*0.05, [1,0,0]);
			var quatX = quat4.fromAngleAxis(0, [0,1,0]);
			var quatRes = quat4.multiply(quatX, quatY);
			var rotMatrix = quat4.toMat4(quatRes);
			mat4.multiply(mMatrix, rotMatrix);
			
			mat4.translate(mMatrix, [0.0,1.0,0.0]);
			mat4.scale(mMatrix, [0.5, 0.05, 0.5]);
			this.groundModel.texture = this.groundTex.texture;
			this.groundModel.draw(gl);
		mvPopMatrix();
		
		mat4.scale(mMatrix, [.001, .001, .001]);
		
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
	gl.uniform3f(this.currentProgram.getUniform("lightingPositionUniform"), 0, 0, 0);
	this.setMVMatrixUniforms(gl);
	this.setPMatrixUniform(gl);
	this.setNormalUniforms(gl); 
}

View.prototype.setupPhongShadowShader = function (gl) {
	this.currentProgram = this.scripts.getProgram("phongShadowShader").useProgram(gl);
	
	gl.uniform1i(this.currentProgram.getUniform("textureUniform"), 0);
	gl.uniform1i(this.currentProgram.getUniform("depthMapUniform"), 1);
	
	gl.uniform3f(this.currentProgram.getUniform("lightingPositionUniform"), 2, 0, 0);
	this.setMVMatrixUniforms(gl);
	this.setPMatrixUniform(gl);
	this.setNormalUniforms(gl); 
}

View.prototype.setupRenderTextureShader = function (gl) {
	this.currentProgram = this.scripts.getProgram("renderTextureShader").useProgram(gl);
	gl.uniform1i(this.currentProgram.getUniform("textureUniform"), 0);
} 

View.prototype.setPMatrixUniform = function (gl) {
	gl.uniformMatrix4fv(this.currentProgram.getUniform("pMatrixUniform"), false, pMatrix);
}

View.prototype.setMVMatrixUniforms = function (gl) {
    gl.uniformMatrix4fv(this.currentProgram.getUniform("mMatrixUniform"), false, mMatrix);
	gl.uniformMatrix4fv(this.currentProgram.getUniform("vMatrixUniform"), false, vMatrix);
	
}

View.prototype.setNormalUniforms = function (gl) {   
    var normalMatrix = mat3.create();
	var mvMatrix = mat4.create();
    mat4.toInverseMat3(mat4.multiply(vMatrix, mMatrix, mvMatrix), normalMatrix);
    mat3.transpose(normalMatrix);
    gl.uniformMatrix3fv(this.currentProgram.getUniform("nMatrixUniform"), false, normalMatrix);
}

//Loading of files:
View.prototype.loadModels = function (gl) {
	this.groundModel = new GLObject(gl, this);
	
	var objectLoader = new FileLoader(13, startTicking, this); 
	
	displayLoadState ("Loading models");
	
	this.house.loadModels(gl, objectLoader);
	loadMesh(gl, this.groundModel, "/ParticleSystem/ParticleSystem/Resources/x-models/ground.ctm", objectLoader);
}

View.prototype.loadTextures = function(thisClass) {
	thisClass.cubeTex = new Texture();
	thisClass.smokeTex = new Texture();
	thisClass.groundTex = new Texture();
	
	var objectLoader = new FileLoader(13, thisClass.setupShadersAndObjects, thisClass); 
	
	displayLoadState ("Loading textures");
	
	thisClass.house.loadTextures(thisClass.gl, objectLoader);
	loadImageToTex(thisClass.gl, thisClass.groundTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/Mortar_color.jpg", objectLoader);
	loadImageToTex(thisClass.gl, thisClass.smokeTex, "/ParticleSystem/ParticleSystem/Resources/x-images/smoke.png", objectLoader, true);
}