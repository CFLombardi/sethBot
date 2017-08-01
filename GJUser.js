var method = GJUser.prototype;

function GJUser(id, name) {
	this.id = id;
  this.name = name;
  this.totalCount = 0;
}

method.getName = function() {
    return this.name;
};

method.getID = function() {
    return this.id;
};

method.setCount = function(count) {
    this.totalCount = count;
};

method.getCount = function(){
	return this.totalCount;
}

method.addDosh = function()
{
	this.totalCount++;
}

method.removeDosh = function()
{
	this.totalCount--;
}

module.exports = GJUser;
