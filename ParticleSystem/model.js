"use strict";
var timeLast;
var startTime;
var timeNow;

var mouseX = 0, mouseY = 0;
var mouseOver = false;
var mouseDown = false;

var Keys = {RIGHT : 39, LEFT : 37, DOWN : 40, UP : 38, SPACE : 32};

var view;

function main () {
	view = new View();

	document.onmousemove = onMouseMove;
	document.onkeydown = onKeyDown;
	
	var canvasElm = document.getElementById("canvas");
	
	canvasElm.onmouseover = function () { mouseOver = true; }
	canvasElm.onmouseout = function () { mouseOver = false; }
	canvasElm.onmousedown = function (e) { mouseDown = true; e.preventDefault(); }
	canvasElm.onmouseup = function () { mouseDown = false; }
	
	document.getElementById("objectCount").value = view.numPointsSqrt; 
	document.getElementById("goButton").onclick = function () {
		var count = document.getElementById("objectCount").value;
		view.numPointsSqrt = count;
		view.numPoints = count*count;
		view.setupFBAndInitTextures(view.gl);
		view.setupShowBillboardShader (view.gl);
		view.first = true;
		timeLast = Date.now();
		startTime = Date.now();
	}
	
	//Initialize mouse position to the middle of the canvas:
	mouseX = canvasElm.width/2;
	mouseY = canvasElm.height/2;
	
	timeLast = Date.now();
	startTime = Date.now();
	timeNow = startTime;
	view.initView();
}

function loadMesh (gl, model, meshLoc, objectLoader) {
	model.loadMeshFromCTMFile(meshLoc, gl, objectLoader);
}

function loadImageToTex (gl, textureObj, imgLoc, objectLoader) {
	var img = new Image();
	img.src = imgLoc;
	img.onload = function () {
		textureObj.texture = new createTexture(img, gl, objectLoader);
	}
}

function loadShaderScript (object, scriptAddress, fileLoader) {
	var request = new XMLHttpRequest();
    request.onreadystatechange = function () { 
    	if (request.readyState == 4) { 
    		object.script = request.responseText;
    		fileLoader.count();
		}
	}
	request.open("GET", scriptAddress, true);
    request.send();
}

function onKeyDown (e) {	
	switch(e.keyCode) {
	case 88:
		view.isUpdatingVelocities = !view.isUpdatingVelocities;
		var velInput = document.getElementById("velInput");
		velInput.checked = view.isUpdatingVelocities;
		break;
	case 90:
		view.isUpdatingPositions = !view.isUpdatingPositions;
		var posInput = document.getElementById("posInput");
		posInput.checked = view.isUpdatingPositions;
		view.zoomFactor = 1.0;
		view.rotYAngle = 0.0;
		break;
	case Keys.LEFT:
		if (!view.isUpdatingPositions)
			view.rotYAngle -= 0.1;
		break;
	case Keys.RIGHT:
		if (!view.isUpdatingPositions)
			view.rotYAngle += 0.1;
		break;
	case Keys.UP:
		if (!view.isUpdatingPositions)	
			view.zoomFactor *= 1.01;
		e.preventDefault();
		break;
	case Keys.DOWN:
		if (!view.isUpdatingPositions)
			view.zoomFactor *= 0.99;
		e.preventDefault();
		break;
	}
}

function onMouseMove(e) {
	if (mouseOver) {
		if(e.offsetX == undefined) // this works for Firefox
		{
			if (document.getElementById("canvas").offsetLeft == 0) {
				mouseX = e.pageX - 267;
				mouseY = e.pageY - 66;
			}
			else {
				mouseX = e.pageX - document.getElementById("canvas").offsetLeft;
				mouseY = e.pageY - document.getElementById("canvas").offsetTop;
			}
		}
		else {
			mouseX = e.offsetX;//clientX;//e.movementX || e.webkitMovementX || e.mozMovementX || 0;
			mouseY = e.offsetY;//clientY;//e.movementY || e.webkitMovementY || e.mozMovementX || 0;
		}
	}
}

function toggleVelocities () {
	var velInput = document.getElementById("velInput");
	view.isUpdatingVelocities = velInput.checked;
}

function togglePositions () {
	var posInput = document.getElementById("posInput");
	view.isUpdatingPositions = posInput.checked;
	view.zoomFactor = 1.0;
	view.rotYAngle = 0.0;
}

function FileLoader (fileCount, onCompleteFunction, originClass) {
	this.fileCount = fileCount;
	this.filesLoaded = 0;
	this.onCompleteFunction = onCompleteFunction;
	this.originClass = originClass;
}

FileLoader.prototype.count = function () {
	this.filesLoaded++;
	if (this.filesLoaded == this.fileCount) {
		this.onCompleteFunction(this.originClass);
	}
}