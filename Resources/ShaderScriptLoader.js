"use strict";

function ShaderScriptLoader (gl, callback, callingClass) {
	this.gl = gl;
	this.callback = callback;
	this.callingClass = callingClass;
	this.programsInds = []; // { (vsIndex,fsIndex), (vsIndex,fsIndex), (vsIndex,fsIndex), ...}
	this.programs = [];
	this.vsScriptAdds = [];
	this.fsScriptAdds = [];
	this.vsScriptObjs = [];
	this.fsScriptObjs = [];
	this.pointers = [];
}

ShaderScriptLoader.prototype.addProgram = function (programName, vsScriptAdd, fsScriptAdd) {
	var vsIndex = this.findScript(this.vsScriptAdds, vsScriptAdd);
	var fsIndex = this.findScript(this.fsScriptAdds, fsScriptAdd);
	
	this.programsInds.push([programName, vsIndex, fsIndex]);
}


ShaderScriptLoader.prototype.findScript = function (list, scriptAdd) {
	for (var i = 0; i < list.length; i++) {
		if (scriptAdd == list[i])
			return i;
	}
	//if not in list then add to the end and return index:
	return list.push(scriptAdd) - 1;
}

ShaderScriptLoader.prototype.loadScripts = function () {

	var objectLoader = new FileLoader(this.vsScriptAdds.length + this.fsScriptAdds.length, this.createPrograms, this); 
	for (var i = 0; i < this.vsScriptAdds.length; i++) {
		this.vsScriptObjs[i] = new ScriptObject();
		loadShaderScript(this.vsScriptObjs[i], this.vsScriptAdds[i], objectLoader);
	}
	for (var i = 0; i < this.fsScriptAdds.length; i++) {
		this.fsScriptObjs[i] = new ScriptObject();
		loadShaderScript(this.fsScriptObjs[i], this.fsScriptAdds[i], objectLoader);
	}
}

ShaderScriptLoader.prototype.createPrograms = function (thisClass) { 
	for (var i = 0; i < thisClass.programsInds.length; i++) {		
		var programName = thisClass.programsInds[i][0];
		var vsScript = thisClass.vsScriptObjs[thisClass.programsInds[i][1]].script;
		var fsScript = thisClass.fsScriptObjs[thisClass.programsInds[i][2]].script;
		
		thisClass.pointers[programName] = thisClass.programs.push(new Shader(thisClass.gl, vsScript, fsScript)) - 1;
	}
	
	thisClass.callback(thisClass.callingClass);
}

ShaderScriptLoader.prototype.getProgram = function(name) {
	return this.programs[this.pointers[name]];
} 