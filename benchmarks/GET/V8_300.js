var redis = require("../../Client-Libraries/NodeJS/node_redis-0.8.3/"),
	client = redis.createClient();

client.on("error", function (err) {
	console.log("Error " + err);
});

client.set('bench_key', 'value', function(err,reply){
	var start = +new Date;
	var done = 0;
	for(var i=0;i<1000000/300;i++){
		client.js(['var ret = []; for(var i=0;i<300;i++) ret.push(redis.get("bench_key")); return ret;'],function(err, reply){
			reply = JSON.parse(reply);
			done++;
			if(done>=1000000/300){
				var dt = new Date - start;
				console.log('Speed: '+Math.round(1000000/(dt/1000))+' ops/sec')
				client.quit();
			}
		});
	}
});
