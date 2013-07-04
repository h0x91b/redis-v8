var redis = require("../../Client-Libraries/NodeJS/node_redis-0.8.3/"),
	client = redis.createClient();

client.on("error", function (err) {
	console.log("Error " + err);
});

client.set('bench_key', '1', function(err,reply){
	var start = +new Date;
	var done = 0;
	for(var i=0;i<1000000/100;i++){
		client.js(['var ret = 0; for(var i=0;i<100;i++) ret = redis.incr("bench_key"); return ret;'],function(err, reply){
			done++;
			if(done>=1000000/100){
				var dt = new Date - start;
				console.log('Speed: '+Math.round(1000000/(dt/1000))+' ops/sec')
				client.quit();
			}
		});
	}
});
