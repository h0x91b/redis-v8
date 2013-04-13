/*
"*4
$5
hello
$11
hello
world
$2
id
:15
"
*/
//var test = "*4\n$5\nhello\n$11\nhello\nworld\n$2\nid\n:15\n";
//redis = {};
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

test(new Array(100).join('Hello from v8! '));

test(1,2,3);
redis.test(3,2,1);
redis.run('INCR','KV:V8TEST');
redis.run('INCR','KV:V8TEST');
redis.run('INCRBY','KV:V8TEST',10);
redis.run('set','hello','world');
redis.run('get','hello');
redis.run('hmset','HSET:V8','hello','hello\nworld','id',15,'title','test title');
var hgetall = redis.hgetall('HSET:V8');
for(var k in hgetall){
	test("key '"+k+"'='"+hgetall[k]+"'");
}