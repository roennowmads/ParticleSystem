"use strict";

function View() {
	this.canvas;
	this.gl;
	
	this.house = new House(this);
	this.groundModel;
	this.groundTex;
	
	this.zoomFactor = 0.8;

	this.lastGLObject;
	this.lastDrawTarget;

	this.numPointsSqrt = document.getElementById("objectCount").value;
	this.numPoints = this.numPointsSqrt * this.numPointsSqrt;
	
	this.isUpdatingVelocities = true;
	this.isUpdatingPositions = true;
	this.drawShadows = true;
	this.drawDepth = false;
	this.drawVelocity = false;
	this.drawBloom = false;
	this.isRotating = false;
	this.pointSize = 1.0;
	
	this.scripts;
	this.particles;
	
	this.lightPosition = vec3.create([-2,4,7]);
	
	this.rotateShadowCounter = 0.0;
	this.rotateCounter = 0.0;	
}

View.prototype.initView = function () {
	this.canvas = document.getElementById("canvas");
	this.gl = initGL(this.canvas);
	
	//Query WebGL extensions:
	var float_texture_ext = this.gl.getExtension('OES_texture_float');
	if (!float_texture_ext)
		alert("OES_texture_float extension is not available!");
	
	var depth_texture_ext = this.gl.getExtension('WEBGL_depth_texture');
	if (!depth_texture_ext)
		alert("WEBGL_depth_texture extension is not available!");
		
	//Create shader programs:
	this.scripts = new ShaderScriptLoader(this.gl, this.loadTextures, this);
	this.scripts.addProgram("showBillboardShader", "showBillboard", "showBillboard");
	this.scripts.addProgram("initialParticleShader", "FBTexture", "initialParticle");
	this.scripts.addProgram("updateVelParticleShader", "FBTexture", "updateVelParticle");
	this.scripts.addProgram("updatePosParticleShader", "FBTexture", "updatePosParticle");
	this.scripts.addProgram("renderTextureShader", "FBTexture", "FBTexture");
	this.scripts.addProgram("shadowShader", "shadow", "shadow");
	this.scripts.addProgram("phongShadowShader", "phongShadow", "phongShadow");
	this.scripts.addProgram("blurShader", "FBTexture", "blur");
	this.scripts.addProgram("renderTextureAdditiveShader", "FBTexture", "FBTextureAdditive");
	
	//Downloads scripts and calls loadTextures when done, which calls setupShadersAndObjects when done:
	this.scripts.loadScripts();
}

View.prototype.setupShadersAndObjects = function (thisClass) {	
	var gl = thisClass.gl;
	
	//Instantiate particles:
	thisClass.particles = new Particles(thisClass, thisClass.smokeTex, true);
	thisClass.particles2 = new Particles(thisClass, thisClass.house.textures[0], false);
	
	//Instantiate screen framebuffers for blooming:
	thisClass.shadowFBinit(gl);
	thisClass.sceneFBinit(gl);
	thisClass.blurFBinit(gl);

	//Setup GL:
	thisClass.setupCanvas(gl);
	
	//Setup the shaders:
	thisClass.particles.setup(gl);
	thisClass.particles2.setup(gl);
	thisClass.setupShadowShader(gl);
	thisClass.setupPhongShadowShader(gl);
	thisClass.setupRenderTextureShader(gl);
	thisClass.setupRenderTextureAdditiveShader(gl);
	
	//Load models:
	thisClass.loadModels(gl);
}

View.prototype.animate = function () {
	timeNow = Date.now();
	var elapsed = timeNow - timeLast;
    this.deltaTime = 0.001 * elapsed * 60;
	
	//if (this.isUpdatingPositions) 
	//	this.rotYAngle = 0;
		
	timeLast = timeNow;
	
	if (this.drawShadows)
		this.rotateShadowCounter += 0.05 * this.deltaTime;
	this.rotateCounter -= 0.01 * this.deltaTime;
}

View.prototype.draw = function () {
	var gl = this.gl;
	
	//Clear the screen:
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    
    mat4.identity(mMatrix);
	mat4.identity(vMatrix);

	//Create depth map:
	if (this.drawShadows)
		this.drawHouseAndGroundFromLight(gl);
	
	if (this.drawDepth) {
		//Draw depth map directly to the screen:
		this.currentProgram = this.scripts.getProgram("renderTextureShader").useProgram(gl);
		this.particles.FBparticlesModel.drawOnFBMulti(this.gl, this.shadowFB, this.shadowFB.texDepth, this.shadowFB.texDepth);
	} else {
		//Draw the scene:
		
		this.currentProgram = this.scripts.getProgram("phongShadowShader").useProgram(gl);
		
		//Setup camera:
		mat4.lookAt([0,4,5], [0,0,0], [0,1,0], vMatrix);
		
		if (this.isRotating) {
			var quatY = quat4.fromAngleAxis(this.rotateCounter, [0,1,0]);
			var rotMatrix = quat4.toMat4(quatY);
			mat4.multiply(vMatrix, rotMatrix);
		}
		
		if (this.drawBloom) {
			//Render the scene into a texture:
			this.sceneFB.bind(gl, this.sceneFB.front);
			this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
			this.drawHouseAndGround(gl);
			//this.particles.draw(gl, this.sceneFB);
			
			//Depth testing is unnecessary for 2D image rendering, so it is disabled:
			gl.disable(gl.DEPTH_TEST);
			//Apply blur, first horizontal, then vertical:
			this.currentProgram = this.scripts.getProgram("blurShader").useProgram(gl);
			//Bind the blur framebuffer:
			this.blurFB.bind(gl, this.blurFB.front);
			gl.uniform1i(this.currentProgram.getUniform("orientationUniform"), 0);
			//Here the model used for the particles is used, simply because a square model was needed, and it was the fastest way:
			this.particles.FBparticlesModel.drawOnFBOne(this.gl, this.sceneFB, this.sceneFB.texFront);
			gl.uniform1i(this.currentProgram.getUniform("orientationUniform"), 1);
			this.particles.FBparticlesModel.drawOnFBOne(this.gl, this.sceneFB, this.blurFB.texFront);
			
			//Render the texture:
			this.currentProgram = this.scripts.getProgram("renderTextureAdditiveShader").useProgram(gl);
			this.sceneFB.unbind(gl);
			gl.uniform1f(this.currentProgram.getUniform("tex1RateUniform"), 0.75);
			gl.uniform1f(this.currentProgram.getUniform("tex2RateUniform"), 0.7);
			this.particles.FBparticlesModel.drawOnFBMulti(this.gl, this.sceneFB, this.blurFB.texFront, this.sceneFB.texFront);
			gl.enable(gl.DEPTH_TEST);
			
		}
		else {
			this.drawHouseAndGround(gl);
			this.particles.draw(gl, false, this.pointSize);
		}
		
		if (this.drawPositions) {
			//Draw the positions map used for the particles, directly to the screen:
			gl.disable(gl.DEPTH_TEST);
			this.currentProgram = this.scripts.getProgram("renderTextureShader").useProgram(gl);
			this.particles.FBparticlesModel.drawOnFBOne(gl, this.particles.posFB, this.particles.posFB.texBack);
			gl.enable(gl.DEPTH_TEST);
		}
	}
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

//This is the update function, which is called every frame:
function tick () {
	view.draw();
	view.animate();
	logFrameRate();
	requestAnimFrame(tick);
}

function startTicking() {
	//Remove loading information:
	var prevText = document.getElementById("loadingFile");
	if (prevText)
		canvasDiv.removeChild(prevText);
		
	//Start updating:
	tick();
}

View.prototype.shadowFBinit = function (gl) {
	//Create framebuffer with depth component:
	this.shadowFB = new FBO(gl, 4096, true);
}
View.prototype.sceneFBinit = function (gl) {
	//Create framebuffer with depth component:
	this.sceneFB = new FBO(gl, 1024, true);
}
View.prototype.blurFBinit = function (gl) {
	//Create framebuffer without depth component, and with linear texture filtering:
	this.blurFB = new FBO(gl, 128, false, true);
}

View.prototype.drawHouseAndGroundFromLight = function (gl) {
	mvPushMatrix();
		this.currentProgram = this.scripts.getProgram("shadowShader").useProgram(gl);
		
		//Bind the depth texture framebuffer:
		this.shadowFB.bind(gl, this.shadowFB.front);
		
		gl.viewport(0, 0, this.shadowFB.widthFB, this.shadowFB.widthFB);
		gl.clear(gl.DEPTH_BUFFER_BIT);
		gl.disable(gl.BLEND);
		
		//We only need the depth, so disable colour writes (this improves performance significantly):
		gl.colorMask(false, false, false, false);
		
		//Setup light "camera"
		mat4.lookAt(this.lightPosition, [0,0,0], [0,1,0], lightVMatrix);
		
		var quatY = quat4.fromAngleAxis(0, [1,0,0]);
		var quatX = quat4.fromAngleAxis(this.rotateShadowCounter*0.5, [0,1,0]);
		var quatRes = quat4.multiply(quatX, quatY);
		var rotMatrix = quat4.toMat4(quatRes);
		mat4.multiply(lightVMatrix, rotMatrix);
		
		//Ground:
		mvPushMatrix();
			mat4.translate(mMatrix, [0.0,-.16,0.0]);
			mat4.scale(mMatrix, [3, 0.05, 3]);
			
			this.groundModel.texture = this.groundTex.texture;
			this.groundModel.drawDepth(gl);
		mvPopMatrix();
		
		//Rotating block:
		mvPushMatrix();	
			var quatY = quat4.fromAngleAxis(this.rotateShadowCounter, [1,0,0]);
			var quatX = quat4.fromAngleAxis(0, [0,1,0]);
			var quatRes = quat4.multiply(quatX, quatY);
			var rotMatrix = quat4.toMat4(quatRes);
			mat4.multiply(mMatrix, rotMatrix);
			
			mat4.translate(mMatrix, [2.0,1.0,0.0]);
			mat4.scale(mMatrix, [0.5, 0.05, 0.5]);
			
			this.groundModel.texture = this.groundTex.texture;
			this.groundModel.drawDepth(gl);
		mvPopMatrix();
		
		mat4.scale(mMatrix, [.001, .001, .001]);
		
		//Draw house:
		this.house.drawDepth(gl);
		
		//Unbind framebuffer:
		this.shadowFB.unbind(gl);
		
		//Re-enable blending and colour writes:
		gl.enable(gl.BLEND);
		gl.colorMask(true, true, true, true);
	
	mvPopMatrix();
}

View.prototype.drawHouseAndGround = function (gl) {	
	mvPushMatrix();
		//Bind the depth texture for use in the shader:
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.shadowFB.texDepth);
	
		gl.disable(gl.BLEND);
		
		//Ground:
		mvPushMatrix();		
			mat4.translate(mMatrix, [0.0,-.16,0.0]);
			mat4.scale(mMatrix, [3, 0.05, 3]);
			this.groundModel.texture = this.groundTex.texture;
			this.groundModel.draw(gl);
		mvPopMatrix();
		
		//Rotating block:
		mvPushMatrix();		
			var quatY = quat4.fromAngleAxis(this.rotateShadowCounter, [1,0,0]);
			var quatX = quat4.fromAngleAxis(0, [0,1,0]);
			var quatRes = quat4.multiply(quatX, quatY);
			var rotMatrix = quat4.toMat4(quatRes);
			mat4.multiply(mMatrix, rotMatrix);
			
			mat4.translate(mMatrix, [2.0,1.0,0.0]);
			mat4.scale(mMatrix, [0.5, 0.05, 0.5]);
			this.groundModel.texture = this.groundTex.texture;
			this.groundModel.draw(gl);
		mvPopMatrix();
		
		mat4.scale(mMatrix, [.001, .001, .001]);
		
		//House
		this.house.draw(gl);
		gl.enable(gl.BLEND);
	mvPopMatrix();
}

View.prototype.setupShadowShader = function (gl) {
	this.currentProgram = this.scripts.getProgram("shadowShader").useProgram(gl);
	gl.uniform3fv(this.currentProgram.getUniform("lightingPositionUniform"), this.lightPosition);
	this.setMVMatrixUniforms(gl);
	this.setPMatrixUniform(gl);
	this.setNormalUniforms(gl); 
}

View.prototype.setupPhongShadowShader = function (gl) {
	this.currentProgram = this.scripts.getProgram("phongShadowShader").useProgram(gl);
	
	gl.uniform1i(this.currentProgram.getUniform("textureUniform"), 0);
	gl.uniform1i(this.currentProgram.getUniform("depthMapUniform"), 1);
	
	gl.uniform3fv(this.currentProgram.getUniform("lightingPositionUniform"), this.lightPosition);
	this.setMVMatrixUniforms(gl);
	this.setPMatrixUniform(gl);
	this.setNormalUniforms(gl); 
}

View.prototype.setupRenderTextureShader = function (gl) {
	this.currentProgram = this.scripts.getProgram("renderTextureShader").useProgram(gl);
	gl.uniform1i(this.currentProgram.getUniform("textureUniform"), 0);
} 

View.prototype.setupRenderTextureAdditiveShader = function (gl) {
	this.currentProgram = this.scripts.getProgram("renderTextureAdditiveShader").useProgram(gl);
	gl.uniform1i(this.currentProgram.getUniform("textureUniform"), 0);
	gl.uniform1i(this.currentProgram.getUniform("texture2Uniform"), 1);
}

View.prototype.setPMatrixUniform = function (gl) {
	gl.uniformMatrix4fv(this.currentProgram.getUniform("pMatrixUniform"), false, pMatrix);
}

View.prototype.setMVMatrixUniforms = function (gl) {
    gl.uniformMatrix4fv(this.currentProgram.getUniform("mMatrixUniform"), false, mMatrix);
	gl.uniformMatrix4fv(this.currentProgram.getUniform("vMatrixUniform"), false, vMatrix);
}

View.prototype.setShadowMatrixUniforms = function (gl) {
	mvMatrix = mat4.multiply(vMatrix, mMatrix, mvMatrix);
    gl.uniformMatrix4fv(this.currentProgram.getUniform("mVMatrixUniform"), false, mvMatrix);
	
	plmMatrix = mat4.multiply(pMatrix, mat4.multiply(lightVMatrix, mMatrix, plmMatrix), plmMatrix);
	gl.uniformMatrix4fv(this.currentProgram.getUniform("pLMMatrixUniform"), false, plmMatrix);
}

View.prototype.setPMVMatrixUniforms = function (gl) {	
	//Do the matrix projection on the CPU, instead of for every vertex on the GPU:
	pmvMatrix = mat4.multiply(pMatrix, mat4.multiply(vMatrix, mMatrix, pmvMatrix), pmvMatrix)
	gl.uniformMatrix4fv(this.currentProgram.getUniform("pMVMatrixUniform"), false, pmvMatrix);
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
	
	displayLoadState ("Downloading models");
	
	this.house.loadModels(gl, objectLoader);
	loadMesh(gl, this.groundModel, "/ParticleSystem/ParticleSystem/Resources/x-models/ground.ctm", objectLoader);
}

View.prototype.loadTextures = function(thisClass) {
	thisClass.cubeTex = new Texture();
	thisClass.smokeTex = new Texture();
	thisClass.groundTex = new Texture();
	
	var objectLoader = new FileLoader(13, thisClass.setupShadersAndObjects, thisClass); 
	
	displayLoadState ("Downloading textures");
	
	thisClass.house.loadTextures(thisClass.gl, objectLoader);
	loadImageToTex(thisClass.gl, thisClass.groundTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/Mortar_color.jpg", objectLoader);
	loadImageToTex(thisClass.gl, thisClass.smokeTex, "/ParticleSystem/ParticleSystem/Resources/x-images/smoke.png", objectLoader, true);
}