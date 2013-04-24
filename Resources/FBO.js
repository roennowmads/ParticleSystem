"use strict";

function FBO (gl, width, includeDepth, linearFiltering) {
	this.widthFB = width;
	this.heightFB = width;
	
	this.buffer1 = gl.createFramebuffer();
	this.texFront = this.createAndSetupTexture (gl, linearFiltering);
	this.bindFBAndAttachTex(gl, this.buffer1, this.texFront);
	
	//In the cases where depth is needed, double buffering is not needed, so do not create a second buffer:
	if (includeDepth) {
		this.texDepth = this.bindFBAndAttachDepthTex(gl, this.buffer1);
	}
	else {
		this.buffer2 = gl.createFramebuffer();
		this.texBack = this.createAndSetupTexture (gl, linearFiltering);
		this.bindFBAndAttachTex(gl, this.buffer2, this.texBack);
	}
	
	this.front = this.buffer1;
	this.back = this.buffer2;
}

FBO.prototype.bindFBAndAttachDepthTex = function (gl, buffer) {
	gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
	var depthTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, depthTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, this.widthFB, this.heightFB, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);
	
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	return depthTexture;
}

FBO.prototype.bindFBAndAttachTex = function (gl, buffer, tex) {
	gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

FBO.prototype.bind = function (gl, buffer) {
	gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
}

FBO.prototype.unbind = function (gl) {
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

FBO.prototype.swap = function (gl) {
	var temp = this.front;
	this.front = this.back;
	this.back = temp;
}

FBO.prototype.createAndSetupTexture = function (gl, linearFiltering) {
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	
	gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
	gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	if (linearFiltering) {
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	}
	else {
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	}
	
	// make the texture the same size as the image
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, this.widthFB, this.heightFB, 0, gl.RGB, gl.FLOAT, null);
	
	return texture;
}