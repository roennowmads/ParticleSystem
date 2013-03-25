"use strict";

function FBO (gl, width) {
	this.widthFB;
	this.heightFB;
	this.FB = this.createFrameBuffer(gl, width, width);
}

FBO.prototype.createFrameBuffer = function (gl, width, height) {
	var FB = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, FB);
    this.widthFB = width;
    this.heightFB = height;
    
    return FB;
    //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

FBO.prototype.bindFBAndAttachTex = function (gl, tex) {
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.FB);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function createAndSetupTexture (gl, width, height) {
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	
	gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
	gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
	// Set up texture so we can render any size image and so we are
	// working with pixels.
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	
	// make the texture the same size as the image
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.FLOAT, null);
	
	return texture;
}