
function House (view) {
	this.view = view;
	this.models = new Array();
	this.textures = new Array();
}

House.prototype.draw = function (gl) {
	for (var i = 0; i < this.models.length; i++) {
		var j = i;
		if (i > 6)
			j--;
		if (this.textures[i]) {
			this.models[i].texture = this.textures[j].texture;	
		}
		this.models[i].draw(gl);
	}
}

House.prototype.loadTextures = function (gl, objectLoader) {
	var leftWallTex = new Texture();
	var frontWallTex = new Texture();
	var rightWallTex = new Texture();
	var backWallTex = new Texture();
	var upperWallTex = new Texture();
	var upperWallBackTex = new Texture();
	var roofTex = new Texture();
	var roofAccessoriesTex = new Texture();
	var pillarsTex = new Texture();
	var patioTex = new Texture();
	var doorTex = new Texture();
	
	this.textures.push(
		leftWallTex, 
		frontWallTex, 
		rightWallTex,
		backWallTex,
		upperWallTex,
		upperWallBackTex,
		roofTex,
		roofAccessoriesTex,
		pillarsTex,
		patioTex,
		doorTex
	); 
	
	loadImageToTex(gl, leftWallTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/LeftWallLogs_color.jpg", objectLoader);
	loadImageToTex(gl, frontWallTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/FrontWallLogs_color.jpg", objectLoader);
	loadImageToTex(gl, rightWallTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/LeftWallLogs_color.jpg", objectLoader);
	loadImageToTex(gl, backWallTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/LeftWallLogs_color.jpg", objectLoader);
	loadImageToTex(gl, upperWallTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/UpperWall_color.jpg", objectLoader);
	loadImageToTex(gl, upperWallBackTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/UpperWall_color.jpg", objectLoader);
	loadImageToTex(gl, roofTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/Roof_color.jpg", objectLoader);
	loadImageToTex(gl, roofAccessoriesTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/RoofAccessories_color.jpg", objectLoader);
	loadImageToTex(gl, pillarsTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/Pillars_color.jpg", objectLoader);
	loadImageToTex(gl, patioTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/Patio_color.jpg", objectLoader);
	loadImageToTex(gl, doorTex, "/ParticleSystem/ParticleSystem/Resources/x-images/House/Door_color.jpg", objectLoader);
}

House.prototype.loadModels = function (gl, objectLoader) {
	var door = new GLObject(gl, this.view);
	var doorHandle = new GLObject(gl, this.view);
	var frontWallLogs = new GLObject(gl, this.view);
	var backWall = new GLObject(gl, this.view);
	var insideCottage = new GLObject(gl, this.view);
	var interiorFloor = new GLObject(gl, this.view);
	var leftWallLogs = new GLObject(gl, this.view);
	var rightWallMortar = new GLObject(gl, this.view);
	var patio = new GLObject(gl, this.view);
	var pillars = new GLObject(gl, this.view);
	var rightWallLogs = new GLObject(gl, this.view);
	var roofPanel1 = new GLObject(gl, this.view);
	var roofPanel2 = new GLObject(gl, this.view);
	var roofAccessories = new GLObject(gl, this.view);
	var upperWall = new GLObject(gl, this.view);
	var upperWallBack = new GLObject(gl, this.view);
	
	this.models.push(
		leftWallLogs, 
		frontWallLogs, 
		rightWallLogs, 
		backWall, 
		upperWall, 
		upperWallBack, 
		roofPanel1, 
		roofPanel2, 
		roofAccessories, 
		pillars, 
		patio, 
		door
	);

	loadMesh(gl, door, "/ParticleSystem/ParticleSystem/Resources/x-models/door.ctm", objectLoader);
	loadMesh(gl, frontWallLogs, "/ParticleSystem/ParticleSystem/Resources/x-models/frontWall.ctm", objectLoader);
	loadMesh(gl, backWall, "/ParticleSystem/ParticleSystem/Resources/x-models/backWall.ctm", objectLoader);
	loadMesh(gl, leftWallLogs, "/ParticleSystem/ParticleSystem/Resources/x-models/leftWall.ctm", objectLoader);
	loadMesh(gl, patio, "/ParticleSystem/ParticleSystem/Resources/x-models/patio.ctm", objectLoader);
	loadMesh(gl, pillars, "/ParticleSystem/ParticleSystem/Resources/x-models/pillars.ctm", objectLoader);
	loadMesh(gl, rightWallLogs, "/ParticleSystem/ParticleSystem/Resources/x-models/rightWallFull.ctm", objectLoader);
	loadMesh(gl, roofPanel1, "/ParticleSystem/ParticleSystem/Resources/x-models/roofPanel.ctm", objectLoader);
	loadMesh(gl, roofPanel2, "/ParticleSystem/ParticleSystem/Resources/x-models/roofPanel2.ctm", objectLoader);
	loadMesh(gl, roofAccessories, "/ParticleSystem/ParticleSystem/Resources/x-models/roofAccessories.ctm", objectLoader);
	loadMesh(gl, upperWall, "/ParticleSystem/ParticleSystem/Resources/x-models/frontRoofWall.ctm", objectLoader);
	loadMesh(gl, upperWallBack, "/ParticleSystem/ParticleSystem/Resources/x-models/backRoofWall.ctm", objectLoader);
}