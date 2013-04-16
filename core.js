redis.str = '';
redis.bufindex = 0;

redis.ok_return = function(){
	redis.bufindex = redis.str.indexOf('\n',redis.bufindex)+1;
	//str = redis.str.substr(redis.str.indexOf('\n')+1);
	return true;
}

redis.err_return = function(){
	//str = redis.str.substr(redis.str.indexOf('\n')+1);
	redis.bufindex = redis.str.indexOf('\n',redis.bufindex)+1;
	return false;
}

redis.string_return = function(){
	var pos = redis.str.indexOf('\n',redis.bufindex)+1;
	var length = parseInt(redis.str.substr(redis.bufindex+1,pos-redis.bufindex-1));
	//str = redis.str.substr(pos+length+2);
	redis.bufindex = pos+length+2;
	return redis.str.substr(pos,length);
}

redis.integer_return = function(){
	var pos = redis.str.indexOf('\n',redis.bufindex)+1;
	var ret = parseFloat(redis.str.substr(redis.bufindex+1,pos-redis.bufindex-1));
	//str = redis.str.substr(redis.str.indexOf('\n')+1);
	redis.bufindex = pos;
	return ret;
}

redis.bulk_return = function(){
	var obj = [];
	var pos = redis.str.indexOf('\n',redis.bufindex)+1;
	var bulks = parseInt(redis.str.substr(redis.bufindex+1,pos-redis.bufindex));
	//str = redis.str.substr(pos);
	redis.bufindex = pos;
	for(var i=0;i<bulks;i++){
		obj.push(redis.parse());
	}
	return obj;
}

redis.parse = function(){
	if(redis.str[redis.bufindex]==='+'){
		return redis.ok_return();
	}
	else if(redis.str[redis.bufindex]==='$') {
		return redis.string_return();
	}
	else if(redis.str[redis.bufindex]===':'){
		return redis.integer_return();
	}
	else if(redis.str[redis.bufindex]==='*'){
		return redis.bulk_return();
	}
	else if(redis.str[redis.bufindex]==='-'){
		return redis.err_return();
	}
}

redis.run = function(){
	//'*6\n$5\nhello\n$11\nhello\nworld\n$2\nid\n:15\n$5\ntitle\n$10\ntest title\n'
	redis.str = redis.__run.apply(this,arguments);
	redis.bufindex = 0;
	return JSON.stringify({ret:redis.parse()});
}

redis.hgetall = function(key){
	redis.str = redis.__run.apply(this,['HGETALL',key]);
	redis.bufindex = 0;
	
	var resp = redis.parse();//redis.run.call(this,'HGETALL',key);
	test(resp);
	var ret = {};
	for(var i=0; i<resp.length; i+=2){
		ret[resp[i]] = resp[i+1];
	}
	return JSON.stringify({ret:ret});
	//return ret;
}

redis.get = function(key){
	return this.run('GET',key);
}

redis.set = function(key,value){
	return this.run('SET',key,value);
}

redis.setex = function(key,expire,value){
	return this.run('SETEX',key,expire,value);
}

redis.ping = function(){
	return this.run('PING');
}
//redis.run();

//%OptimizeFunctionOnNextCall(redis.ok_return);

//optimize(redis.ok_return);