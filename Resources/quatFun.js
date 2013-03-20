function rot (angle) { 
	var quatY = quat4.fromAngleAxis(angle, [0,1,0]);
	var mat = quat4.toMat4(quatY, mat);
	var vec = vec3.create();
	var transMat = mat4.identity();
	mat4.translate(transMat, [1,0,0]);
	mat4.multiplyVec3(transMat, vec);
	mat4.multiplyVec3(mat, vec);
	
	return vec;
}

function applyQuatVec(vec, quat) {
	var mat = quat4.toMat4(quat, mat);
	mat4.multiplyVec3(mat, vec);
	return vec;
}

function slerp (quat1, quat2, t) {
	var dest = quat4.create();
	quat4.slerp(quat1, quat2, t, dest);
	return dest;
}

function slerpApply(quat1, quat2, t, vec) {
	var dest = quat4.create();
	quat4.slerp(quat1, quat2, t, dest);
	var mat = quat4.toMat4(dest, mat);
	mat4.multiplyVec3(mat, vec);
	return vec;
}

//Use to create "circle" around Y axis:
//slerpYApply(0, Math.PI*1.999, 0.1/*0.0-1.0*/, [5,5,0]) 
function slerpYApply(angle1, angle2, t, vec) {
	var quat1Y = quat4.fromAngleAxis(angle1, [0,1,0]);
	var quat2Y = quat4.fromAngleAxis(angle2, [0,1,0]);
	
	var dest = quat4.create();
	quat4.slerp(quat1Y, quat2Y, t, dest);
	var mat = quat4.toMat4(dest, mat);
	mat4.multiplyVec3(mat, vec);
	//vec3.normalize(vec);
	return vec;
}