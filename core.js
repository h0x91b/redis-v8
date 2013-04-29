redis.str = {};//'';
redis.bufindex = 0;
redis.last_error = '';

redis.ok_return = function(){
	redis.bufindex = redis.str.indexOf('\n',redis.bufindex)+1;
	//str = redis.str.substr(redis.str.indexOf('\n')+1);
	return true;
}

redis.err_return = function(){
	//str = redis.str.substr(redis.str.indexOf('\n')+1);
	var pos = redis.str.indexOf('\n',redis.bufindex)+1;
	redis.last_error = redis.str.substr(redis.bufindex+1,pos-3);
	redis.bufindex = pos;
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
	redis.last_error = '';
	redis.str = redis.__run.apply(this,arguments);
	if(redis.str===false){
		redis.last_error = redis.getLastError();
	}
	redis.bufindex = 0;
	return redis.str;
}

redis.inline_return = function(exec_func){
	var ret = exec_func();
	if(ret === undefined) ret = null;
	var ret_obj = {ret:ret,last_error:redis.last_error}; 
	return JSON.stringify(ret_obj);
}

redis.hmset = function(key, obj){
	var f = ['HMSET',key];
	for(var k in obj){
		f.push(k);
		f.push(obj[k]);
	}
	return this.run.apply(this,f);
}

redis.hgetall = function(key){
	redis.last_error = '';
	redis.str = redis.__run.apply(this,['HGETALL',key]);
	redis.bufindex = 0;
	
	var resp = redis.str;
	var ret = {};
	for(var i=0; i<resp.length; i+=2){
		ret[resp[i]] = resp[i+1];
	}
	return ret;
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


/* Log levels
#define REDIS_DEBUG 0
#define REDIS_VERBOSE 1
#define REDIS_NOTICE 2
#define REDIS_WARNING 3
*/
console = {
	pretifyJSON: function(obj){
		if(typeof obj == 'string') return obj;
		if(typeof obj == 'number') return obj;
		return JSON.stringify(obj,null,'\t');
	},
	debug: function(){
		for(var i=0; i<arguments.length; i++)
			redis.__log(0,'argument['+i+'] = ' + console.pretifyJSON(arguments[i]));
	},
	info: function(){
		for(var i=0; i<arguments.length; i++)
			redis.__log(1,'argument['+i+'] = ' + console.pretifyJSON(arguments[i]));
	},
	log: function(){
		for(var i=0; i<arguments.length; i++)
			redis.__log(2,'argument['+i+'] = ' + console.pretifyJSON(arguments[i]));
	},
	warn: function(){
		for(var i=0; i<arguments.length; i++)
			redis.__log(3,'argument['+i+'] = ' + console.pretifyJSON(arguments[i]));
	}
};

console.log('test console.log',13,{hello:5},undefined,null,false);
console.debug('test console.debug',13,{hello:5},undefined,null,false);
console.info('test console.info',13,{hello:5},undefined,null,false);
console.warn('test console.warn',13,{hello:5},undefined,null,false);