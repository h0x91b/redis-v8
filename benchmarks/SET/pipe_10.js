var redis = require("../../Client-Libraries/NodeJS/node_redis-0.8.3/"),
	client = redis.createClient();

client.on("error", function (err) {
	console.log("Error " + err);
});

client.set('bench_key', 'value', function(err,reply){
	var start = +new Date;
	var done = 0;
	for(var i=0;i<100000/10;i++){
		var multi = client.multi();
		for(var n=0;n<10;n++)
			multi.set('bench_key','value');
		
		multi.exec(function(err, reply){
				done++;
				if(done>=100000/10){
					var dt = new Date - start;
					console.log('Speed: '+Math.round(100000/(dt/1000))+' ops/sec')
					client.quit();
				}
			}
		)
	}
	
})