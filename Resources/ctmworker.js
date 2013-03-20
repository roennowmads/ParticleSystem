importScripts("libs/lzma.js", "libs/ctm.js");

self.onmessage = function(event){
	var file = new CTM.File( new CTM.Stream(event.data) );
	self.postMessage(file);
}