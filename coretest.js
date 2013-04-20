redis.test(3,2,1);
test(redis.run('INCR','KV:V8TEST'));
test(redis.run('INCR','KV:V8TEST'));
test(redis.run('INCRBY','KV:V8TEST',10));
test(redis.run('set','hello','world'));
test(redis.run('get','hello'));
test(redis.run('hmset','HSET:V8','hello','hello\nworld','id',15,'title','test title'));
var hgetall = redis.hgetall('HSET:V8');
for(var k in hgetall){
	test("key '"+k+"'='"+hgetall[k]+"'");
}


//heat up
test('heat up get and set');
for(var i=0;i<10000;i++){
	redis.run('set','test'+i,i);
}
for(var i=0;i<10000;i++){
	redis.run('get','test'+i,i);
}
for(var i=0;i<10000;i++){
	redis.run('ping');
}


//start test
test('start test');

var tm = new Date().getTime();
for(var i=0;i<1000000;i++){
	redis.run('set','test'+i,i);
}
tm = new Date().getTime()-tm;
test('1 000 000 sets in '+(tm/1000)+' seconds ('+Math.round(1000000/(tm/1000))+' per second)');


tm = new Date().getTime();
for(var i=0;i<1000000;i++){
	redis.run('get','test'+i,i);
}
tm = new Date().getTime()-tm;
test('1 000 000 gets in '+(tm/1000)+' seconds ('+Math.round(1000000/(tm/1000))+' per second)');

tm = new Date().getTime();
for(var i=0;i<1000000;i++){
	redis.run('del','test'+i,i);
}
tm = new Date().getTime()-tm;
test('1 000 000 dels in '+(tm/1000)+' seconds ('+Math.round(1000000/(tm/1000))+' per second)');

var tm = new Date().getTime();
for(var i=0;i<1000000;i++){
	redis.run('PING');
}
tm = new Date().getTime()-tm;
test('1 000 000 pings in '+(tm/1000)+' seconds ('+Math.round(1000000/(tm/1000))+' per second)');
