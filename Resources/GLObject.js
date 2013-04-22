"use strict";

function GLObject (gl, view) {
	this.vertexPositionBuffer;
	this.vertexNormalBuffer;
	this.vertexIndexBuffer;
	this.vertexTexCoordBuffer;
	this.indexNumItems = 0;
	this.identifier;
	this.texture;
	this.view = view;
}

GLObject.prototype.loadMeshFromCTMFile = function (file, gl, fileLoader) {
	this.identifier = file;
	var glObject = this;
	var request = new XMLHttpRequest();
	request.overrideMimeType("text/plain; charset=x-user-defined");
	request.onreadystatechange = function () { 
		if (request.readyState == 4) { 
		
			displayLoadState ("Loaded model: " + file);
		
			glObject.handleLoadedCTMFile(request.responseText, gl, fileLoader);
		}
	}
	request.open("GET", file, true);
	request.send();
}

GLObject.prototype.handleLoadedCTMFile = function (resp, gl, fileLoader) {
	//var ctmWorker = new Worker("../Resources/ctmworker.js")
	var glObject = this;
	
	/*ctmWorker.onmessage = function (e) {
		glObject.bufferCTMMesh(e.data, gl, fileLoader);
	};
	ctmWorker.postMessage(resp);*/
	
	var data = new CTM.File( new CTM.Stream(resp));
	glObject.bufferCTMMesh(data, gl, fileLoader);
}

GLObject.prototype.bufferCTMMesh = function (file, gl, fileLoader) {		
	var verticesArray = file.body.vertices;
	var indicesArray = new Uint16Array(file.body.indices);
	
	var normalsArray = file.body.normals;
	var texCoordsArray = file.body.uvMaps[0].uv;
	this.indexNumItems = file.body.indices.length;
	
	this.vertexPositionBuffer = gl.createBuffer();
	this.vertexNormalBuffer = gl.createBuffer();
	this.vertexIndexBuffer = gl.createBuffer();
	this.vertexTexCoordBuffer = gl.createBuffer();
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, verticesArray, gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, normalsArray, gl.STATIC_DRAW);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indicesArray, gl.STATIC_DRAW);
 
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTexCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, texCoordsArray, gl.STATIC_DRAW);
	
	this.bindBuffers(gl);
	
	fileLoader.count();
}

GLObject.prototype.bindTexture = function (gl) {
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.texture);
	this.view.currentTexture = this.texture;
}

GLObject.prototype.bindBuffers = function (gl) {
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTexCoordBuffer);
	gl.vertexAttribPointer(this.view.currentProgram.getAttribute("textureCoordAttribute"), 2, gl.FLOAT, false, 0, 0);
		
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
	gl.vertexAttribPointer(this.view.currentProgram.getAttribute("vertexPositionAttribute"), 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
	gl.vertexAttribPointer(this.view.currentProgram.getAttribute("vertexNormalAttribute"), 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
}

GLObject.prototype.draw = function (gl) {	
	//gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	//gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	
	//if (this.view.currentTexture != this.texture)		//Optimizes by not binding the texture, if the same texture is already bound.
		this.bindTexture(gl);
	
	if (this.identifier != this.view.lastGLObject) 		//Optimizes by not binding buffers again for subsequent instances of the same mesh.
		this.bindBuffers(gl);
		
	this.view.setNormalUniforms(gl); 
	this.view.setMVMatrixUniforms(gl);
	gl.drawElements(gl.TRIANGLES, this.indexNumItems, gl.UNSIGNED_SHORT, 0);
	
	this.view.lastGLObject = this.identifier;
}

//Helper functions:
function Texture () {
	this.texture;
}

function createTexture (img, gl, fileLoader, notMipmap) {
	var texture = gl.createTexture();	
	gl.bindTexture(gl.TEXTURE_2D, texture);
	
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	if (!notMipmap) {
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.generateMipmap(gl.TEXTURE_2D);
	}
	else
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	
	gl.bindTexture(gl.TEXTURE_2D, null);
	
	fileLoader.count();
	
	return texture;
}