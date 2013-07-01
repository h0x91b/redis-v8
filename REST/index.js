var express = require('express');
var redis = require("./node_redis-0.8.3/"),
	client = redis.createClient();

client.on("error", function (err) {
	console.log("Redis Error " + err);
});

var app = express();
app.use(express.compress());
app.use(express.methodOverride());
app.use(express.bodyParser());
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	next();
});

//functions list
app.all('/', function(req, res){
	client.jscall(['REST.function_list'],function(err,replies){
		if(err){
			console.log('err',err);
			res.send(503, err.toString());
			return;
		}
		replies = JSON.parse(replies);
		console.log('function_list',replies.ret);
		res.send(JSON.stringify(replies.ret));
	});
});

app.all('/call/:func',function(req,res){
	var call = [req.params.func];
	for(var k in req.body){
		call.push(req.body[k]);
	}
	client.jscall(call,function(err,replies){
		if(err){
			console.log('err',err);
			res.send(503, err.toString());
			return;
		}
		replies = JSON.parse(replies);
		res.send(JSON.stringify(replies.ret));
	})
});

app.listen(3000);