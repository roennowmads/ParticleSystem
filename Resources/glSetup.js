"use strict";

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

var frames = 0;
var time = new Date().getTime();
var time1Sec = 0;
var fps = 0;

var fragmentScript = null;
var vertexScript = null;

function logFrameRate() {
	frames++;
	time1Sec = new Date().getTime();
	if (time <= time1Sec - 1000) {
		fps = frames;
		document.getElementById("FPS").innerHTML = "Framerate: " + fps;
		time = new Date().getTime();
		frames = 0;
	}
}

//Setup starts:
function initGL(canvas) {
	var gl = WebGLUtils.setupWebGL(canvas);
	//gl = WebGLDebugUtils.makeDebugContext(gl);
	if (!gl)
		alert("WebGL not supported");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
	return gl;
}

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

function setPMatrixUniform (gl) {
	gl.uniformMatrix4fv(currentProgram.getUniform("pMatrixUniform"), false, pMatrix);
}

function setMVMatrixUniforms (gl) {
    gl.uniformMatrix4fv(currentProgram.getUniform("mVMatrixUniform"), false, mvMatrix);
}

function setNormalUniforms (gl) {   
    var normalMatrix = mat3.create();
    mat4.toInverseMat3(mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
    gl.uniformMatrix3fv(currentProgram.getUniform("nMatrixUniform"), false, normalMatrix);
}