"use strict";

function ScriptObject () {
	this.script;
}


function Shader (gl, vertexScript, fragmentScript) {
	this.program;
	this.vShader;
	this.fShader;
	this.fragmentScript = fragmentScript;
	this.vertexScript = vertexScript;
	this.attributes = new Array();
	this.uniforms = new Array();
	
	this.getFragmentShader(gl);
	this.getVertexShader(gl);
	this.compileShader(gl);
	this.findInput(gl);
}

Shader.prototype.findInput = function (gl) {
	this.findUniforms(gl, this.fragmentScript);
	this.findUniforms(gl, this.vertexScript);
	this.findAttributes(gl, this.vertexScript);
}

Shader.prototype.getFragmentShader = function (gl) {
	this.fShader = gl.createShader(gl.FRAGMENT_SHADER);
    this.getShader(gl, this.fShader, this.fragmentScript);
}

Shader.prototype.getVertexShader = function (gl) {
    this.vShader = gl.createShader(gl.VERTEX_SHADER);
    this.getShader(gl, this.vShader, this.vertexScript);
}

Shader.prototype.getShader = function (gl, shader, shaderScript) {
    if (!shaderScript) {
        return null;
    }

    gl.shaderSource(shader, shaderScript);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
}

Shader.prototype.compileShader = function (gl) {
	this.program = gl.createProgram();
    gl.attachShader(this.program, this.vShader);
    gl.attachShader(this.program, this.fShader);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
}

Shader.prototype.findUniforms = function (gl, script) {
	var workString = script.substring(0, script.indexOf("void")).trim();
	var lines = workString.split("\n");
	
	for (var i = 0; i < lines.length; i++) {
		if (lines[i].length > 0) {
			var trimmed = lines[i].trim();
			var index = lines[i].indexOf("uniform");
			var indexComments = lines[i].indexOf("//");
			var indexMultiComments = lines[i].indexOf("/*");
			if (index >= 0 && indexComments != 0 && indexMultiComments == -1) {
				var startIndex = trimmed.lastIndexOf(" ") + 1;
				var handle = trimmed.substring(startIndex, trimmed.length-1);
				
				var tempId = handle.substring(1);
				var lowerCaseLetter = tempId.substring(0, 1).toLowerCase();
				var id = lowerCaseLetter + handle.substring(2) + "Uniform";
				this.uniforms[id] = gl.getUniformLocation(this.program, handle);
			}
			else if (indexComments > 0 || indexMultiComments >= 0) {
				console.log("Comments were detected in shader, a uniform might have been lost");
			}
				
		}
	}
}

Shader.prototype.findAttributes = function (gl, script) {
	var workString = script.substring(0, script.indexOf("void")).trim();
	var lines = workString.split("\n");
	
	for (var i = 0; i < lines.length; i++) {
		if (lines[i].length > 0) {
			var index = lines[i].indexOf("attribute");
			var trimmed = lines[i].trim();
			var indexComments = lines[i].indexOf("//");
			var indexMultiComments = lines[i].indexOf("/*");
			if (index >= 0 && indexComments != 0 && indexMultiComments != 0) {
				var startIndex = trimmed.lastIndexOf(" ") + 1;
				var handle = trimmed.substring(startIndex, trimmed.length-1);
				
				var tempId = handle.substring(1);
				var lowerCaseLetter = tempId.substring(0, 1).toLowerCase();
				var id = lowerCaseLetter + handle.substring(2) + "Attribute";
				this.attributes[id] = gl.getAttribLocation(this.program, handle);
				gl.enableVertexAttribArray(this.attributes[id]);
			}
			else if (indexComments > 0 || indexMultiComments > 0) {
				console.log("Comments were detected in shader, an attribute might have been lost");
			}
				
		}
	}
}

Shader.prototype.getAttribute = function (id) {
	return this.attributes[id];
	//return gl.getAttribLocation(this.program, this.attributes[id]);
}

Shader.prototype.getUniform = function (id) {
	return this.uniforms[id];
	//return gl.getUniformLocation(this.program, this.uniforms[id]);
}

Shader.prototype.useProgram = function (gl) {
	gl.useProgram(this.program);
	return this;
}