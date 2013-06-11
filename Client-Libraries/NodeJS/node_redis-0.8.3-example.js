var redis = require("./node_redis-0.8.3/"),
	client = redis.createClient();

// if you'd like to select database 3, instead of 0 (default), call
// client.select(3, function() { /* ... */ });

client.on("error", function (err) {
	console.log("Error " + err);
});

console.log('execute 2+2*2')
//execute a JS script in redis
client.js(["return 2+2*2;"], function(err, replies){
	//return always JSON encoded string
	console.log('JS return:',JSON.parse(replies));
	
	//JSCALL - execute a JS function, and pass args for it
	client.jscall(["redis.set","hello","world"],function(err,replies){
		console.log('store hello world',JSON.parse(replies));
	});
	
	//Get it back
	client.jscall(["redis.get","hello"],function(err,replies){
		console.log('get hello back',JSON.parse(replies));
	})
	
	client.quit();
});
