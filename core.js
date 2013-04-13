redis.run = function(){
	var str = redis.__run.apply(this,arguments);
	var bufindex = 0;
	var parse = function(){
		if(str[0]==='+'){
			str = str.substr(str.indexOf('\n')+1);
			return true;
		}
		else if(str[0]==='-'){
			str = str.substr(str.indexOf('\n')+1);
			return false;
		}
		else if(str[0]===':'){
			var ret = parseFloat(str.substr(1,str.indexOf('\n')-1));
			str = str.substr(str.indexOf('\n')+1);
			return ret;
		}
		else if(str[0]==='$') {
			var pos = str.indexOf('\n')+1;
			var length = parseInt(str.substr(1,pos-2));
			var ret = str.substr(pos,length);
			str = str.substr(pos+length+2);
			return ret;
		}
		else if(str[0]==='*'){
			var obj = [];
			var pos = str.indexOf('\n')+1;
			var bulks = parseInt(str.substr(1,pos));
			str = str.substr(pos);
			for(var i=0;i<bulks;i++){
				obj.push(parse());
			}
			return obj;
		}
		
		test("unknown char '"+str[0]+"'");
	}
	
	return parse();
}
redis.hgetall = function(key){
	var resp = redis.run.call(this,'HGETALL',key);
	test(resp);
	var ret = {};
	for(var i=0; i<resp.length; i+=2){
		ret[resp[i]] = resp[i+1];
	}
	return ret;
}
//redis.run();

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