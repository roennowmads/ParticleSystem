"use strict";

var plmMatrix = mat4.create();
var mvMatrix = mat4.create();
var mMatrix = mat4.create();
var vMatrix = mat4.create();
var lightVMatrix = mat4.create();
var mMatrixStack = [];
var pMatrix = mat4.create();
var pmvMatrix = mat4.create();

var frames = 0;
var time = new Date().getTime();
var time1Sec = 0;
var fps = 0;

var FPSSum = 0;
var FPSsamplesNum = 0;

function logFrameRate() {
	frames++;
	time1Sec = new Date().getTime();
	if (time <= time1Sec - 1000) {
		fps = frames;
		time = new Date().getTime();
		frames = 0;
		
		FPSsamplesNum++;
		FPSSum += fps;
		document.getElementById("FPS").innerHTML = "FPS: " + fps + " --- " + "Avg FPS: " + Math.floor(FPSSum/FPSsamplesNum);
		
		if (FPSsamplesNum > 5) {		
			FPSSum = 0;
			FPSsamplesNum = 0;
		}
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
    mat4.set(mMatrix, copy);
    mMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mMatrix = mMatrixStack.pop();
}