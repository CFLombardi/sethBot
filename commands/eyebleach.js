const http = require('http');
const https = require('https');
var randomBoolean = require('random-boolean');
var parseString = require('xml2js').parseString;
require("collections/shim-array");
require("collections/listen/array-changes");

exports.run = function(config, msg) {
	if(randomBoolean()){
		showCatPicture(config,msg);
	}
	else{
		showDogPicture(msg);
	}
}

exports.messageFired = function(config,msg) {
	//do nothing  
}

function showCatPicture(config,msg){
var options = {
	  host: "api.thecatapi.com",
	  port: 443,
	  path: '/api/images/get?api_key='+config.catApi+'&format=xml&results_per_page=1',
	  method: 'GET'
	};

	https.request(options, function(res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
		parseString(chunk, function (err, result) {
	    	    msg.channel.send(result.response.data[0].images[0].image[0].url[0]);
			});
  		});
	}).end();
	

}

function showDogPicture(msg){
var options = {
	  host: "dog.ceo",
	  port: 443,
	  path: '/api/breeds/image/random',
	  method: 'GET'
	};

	https.request(options, function(res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
	    	msg.channel.send(JSON.parse(chunk).message);
  		});
	}).end();
	

}