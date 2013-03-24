"use strict";

function ShaderScriptLoader (gl) {
	this.gl = gl;
	this.programsInds = []; // { (vsIndex,fsIndex), (vsIndex,fsIndex), (vsIndex,fsIndex), ...}
	this.programs = [];
	this.vsScriptAdds = [];
	this.fsScriptAdds = [];
	this.vsScriptObjs = [];
	this.fsScriptObjs = [];
	this.pointers = [];
}

ShaderScriptLoader.prototype.addProgram = function (vsScriptAdd, fsScriptAdd, programName) {
	var vsIndex = this.findScript(this.vsScriptAdds, vsScriptAdd);
	var fsIndex = this.findScript(this.fsScriptAdds, fsScriptAdd);
	
	this.programsInds.push([vsIndex, fsIndex]);
	
	this.loadScripts(programName, vsIndex, fsIndex);
}

ShaderScriptLoader.prototype.addProgramCont = function (programName, vsIndex, fsIndex) {
	console.log("yeah! " + programName + " " + vsIndex + " " + fsIndex);
	this.pointers[programName] = this.programs.push(new Shader(this.gl, this.vsScriptObjs[vsIndex].script, this.fsScriptObjs[fsIndex].script)) - 1;
}

/*ShaderScriptLoader.prototype.createPrograms = function () { 
	for (var i = 0; i < programInds.length; i++) {
		console.log(programInds[i].vs + " " + programInds[i].fs)
	}
}*/


ShaderScriptLoader.prototype.findScript = function (list, scriptAdd) {
	for (var i = 0; i < list.length; i++) {
		if (scriptAdd == list[i])
			return i;
	}
	//if not in list then add to the end and return index:
	return list.push(scriptAdd) - 1;
}

ShaderScriptLoader.prototype.loadScripts = function (programName, vsIndex, fsIndex) {
	console.log("script count " + (this.vsScriptAdds.length + this.fsScriptAdds.length));

	var objectLoader = new FileLoader(this.vsScriptAdds.length + this.fsScriptAdds.length, this.addProgramCont.bind(this, programName, vsIndex, fsIndex), this); 
	for (var i = 0; i < this.vsScriptAdds.length; i++) {
		this.vsScriptObjs[i] = new ScriptObject();
		loadShaderScript(this.vsScriptObjs[i], this.vsScriptAdds[i], objectLoader);
	}
	for (var i = 0; i < this.fsScriptAdds.length; i++) {
		this.fsScriptObjs[i] = new ScriptObject();
		loadShaderScript(this.fsScriptObjs[i], this.fsScriptAdds[i], objectLoader);
	}
}

ShaderScriptLoader.prototype.getProgram = function(name) {
	return this.programs[this.pointers[name]];
} 