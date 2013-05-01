redis.str = {};
redis.last_error = '';

redis.run = function(){
	redis.last_error = '';
	redis.str = redis.__run.apply(this,arguments);
	if(redis.str===false){
		redis.last_error = redis.getLastError();
	}
	return redis.str;
}

redis.inline_return = function(exec_func){
	var ret = exec_func();
	if(ret === undefined) ret = null;
	var ret_obj = {ret:ret,last_error:redis.last_error}; 
	return JSON.stringify(ret_obj);
}


/* standart redis functions */
// APPEND key value
redis.append = function(key,value){
	return redis.run('APPEND',key,value);
}
// BGREWRITEAOF
redis.bgrewriteaof = function(){
	return redis.run('BGREWRITEAOF');
}
// BGSAVE
redis.bgsave = function(){
	return redis.run('BGSAVE');
}
// BITCOUNT key [start] [end]
// BITOP operation destkey key [key ...]
// BLPOP key [key ...] timeout
// BRPOP key [key ...] timeout
// BRPOPLPUSH source destination timeout
// CLIENT KILL ip:port
// CLIENT LIST
// CLIENT GETNAME
// CLIENT SETNAME connection-name
// CONFIG GET parameter
// CONFIG SET parameter value
// CONFIG RESETSTAT
// DBSIZE
// DEBUG OBJECT key
// DEBUG SEGFAULT
// DECR key
// DECRBY key decrement
// DEL key [key ...]
redis.del = function(key){
	if(arguments.length>1){
		for(var i=0;i<arguments.length;i++)
			this.run('DEL',arguments[i]);
		return;
	}
	return this.run('DEL',key);
}
// DISCARD
// DUMP key
// ECHO message
// EVAL script numkeys key [key ...] arg [arg ...]
// EVALSHA sha1 numkeys key [key ...] arg [arg ...]
// EXEC
// EXISTS key
redis.exists = function(key){
	return this.run('EXISTS',key);
}
// EXPIRE key seconds
// EXPIREAT key timestamp
// FLUSHALL
// FLUSHDB
// GET key
redis.get = function(key){
	return this.run('GET',key);
}
// GETBIT key offset
// GETRANGE key start end
// GETSET key value
// HDEL key field [field ...]
// HEXISTS key field
// HGET key field
// HGETALL key
redis.hgetall = function(key){
	redis.last_error = '';
	redis.str = redis.__run.apply(this,['HGETALL',key]);
	
	if(redis.str.length<1) return null;
	
	var resp = redis.str;
	var ret = {};
	for(var i=0; i<resp.length; i+=2){
		ret[resp[i]] = resp[i+1];
	}
	return ret;
}
// HINCRBY key field increment
// HINCRBYFLOAT key field increment
// HKEYS key
// HLEN key
// HMGET key field [field ...]
redis.hmget = function(key,fields){
	redis.last_error = '';
	var args = fields;
	if(Array.isArray(fields)){
		args.unshift(key);
		args.unshift('HMGET');
	} else {
		args = Array(arguments.length+1);
		args[0] = 'HMGET';
		for(var i=0;i<arguments.length;i++)
			args[i+1] = arguments[i];
	}
	redis.str = redis.__run.apply(this,args);
	
	var resp = redis.str;
	var ret = {};
	for(var i=0;i<resp.length;i++)
		ret[args[i+2]] = resp[i];
	return ret;
}
// HMSET key field value [field value ...]
redis.hmset = function(key, obj){
	var f = ['HMSET',key];
	for(var k in obj){
		f.push(k);
		f.push(obj[k]);
	}
	return this.run.apply(this,f);
}
// HSET key field value
// HSETNX key field value
// HVALS key
// INCR key
redis.incr = function(key){
	return this.run('INCR',key);
}
// INCRBY key increment
// INCRBYFLOAT key increment
// INFO [section]
// KEYS pattern
// LASTSAVE
// LINDEX key index
// LINSERT key BEFORE|AFTER pivot value
// LLEN key
// LPOP key
// LPUSH key value [value ...]
// LPUSHX key value
// LRANGE key start stop
// LREM key count value
// LSET key index value
// LTRIM key start stop
// MGET key [key ...]
// MIGRATE host port key destination-db timeout
// MOVE key db
// MSET key value [key value ...]
// MSETNX key value [key value ...]
// MULTI
// OBJECT subcommand [arguments [arguments ...]]
// PERSIST key
// PEXPIRE key milliseconds
// PEXPIREAT key milliseconds-timestamp
// PING
redis.ping = function(){
	return this.run('PING');
}
// PSETEX key milliseconds value
// PTTL key
// RANDOMKEY
// RENAME key newkey
// RENAMENX key newkey
// RESTORE key ttl serialized-value
// RPOP key
// RPOPLPUSH source destination
// RPUSH key value [value ...]
// RPUSHX key value
// SADD key member [member ...]
// SAVE
// SCARD key
// SCRIPT EXISTS script [script ...]
// SCRIPT FLUSH
// SCRIPT KILL
// SCRIPT LOAD script
// SDIFF key [key ...]
// SDIFFSTORE destination key [key ...]
// SELECT index
// SET key value [EX seconds] [PX milliseconds] [NX|XX]
redis.set = function(key,value){
	if(arguments.length>2){
		var args = [];
		args = Array(arguments.length+1);
		args[0] = 'SET';
		for(var i=0;i<arguments.length;i++)
			args[i+1] = arguments[i];
		return this.run.apply(this,args);
	}
	return this.run('SET',key,value);
}

// SETBIT key offset value
// SETEX key seconds value
redis.setex = function(key,expire,value){
	return this.run('SETEX',key,expire,value);
}
// SETNX key value
// SETRANGE key offset value
// SHUTDOWN [NOSAVE] [SAVE]
// SINTER key [key ...]
// SINTERSTORE destination key [key ...]
// SISMEMBER key member
// SLAVEOF host port
// SLOWLOG subcommand [argument]
// SMEMBERS key
// SMOVE source destination member
// SORT key [BY pattern] [LIMIT offset count] [GET pattern [GET pattern ...]] [ASC|DESC] [ALPHA] [STORE destination]
// SPOP key
// SRANDMEMBER key [count]
// SREM key member [member ...]
// STRLEN key
// SUBSCRIBE channel [channel ...]
// SUNION key [key ...]
// SUNIONSTORE destination key [key ...]
// SYNC
// TIME
// TTL key
// TYPE key
// ZADD key score member [score member ...]
redis.zadd = function(key,score,value){
	if(arguments.length>2){
		var args = [];
		args = Array(arguments.length+1);
		args[0] = 'ZADD';
		for(var i=0;i<arguments.length;i++)
			args[i+1] = arguments[i];
		return this.run.apply(this,args);
	}
	return this.run('ZADD',key,score,value);
}
// ZCARD key
// ZCOUNT key min max
// ZINCRBY key increment member
// ZINTERSTORE destination numkeys key [key ...] [WEIGHTS weight [weight ...]] [AGGREGATE SUM|MIN|MAX]
// ZRANGE key start stop [WITHSCORES]
redis.zrange = function(key,start,stop){
	if(typeof withscores != 'undefined')
		return this.run('ZRANGE',key,start,stop,'WITHSCORES');
	return this.run('ZRANGE',key,start,stop);
}
// ZRANGEBYSCORE key min max [WITHSCORES] [LIMIT offset count]
// ZRANK key member
// ZREM key member [member ...]
redis.zrem = function(key,value){
	if(arguments.length>2){
		var args = [];
		args = Array(arguments.length+1);
		args[0] = 'ZREM';
		for(var i=0;i<arguments.length;i++)
			args[i+1] = arguments[i];
		return this.run.apply(this,args);
	}
	return this.run('ZREM',key,value);
}

// ZREMRANGEBYRANK key start stop
// ZREMRANGEBYSCORE key min max
// ZREVRANGE key start stop [WITHSCORES]
redis.zrevrange = function(key,start,stop,withscores){
	if(typeof withscores != 'undefined')
		return this.run('ZREVRANGE',key,start,stop,'WITHSCORES');
	return this.run('ZREVRANGE',key,start,stop);
}
// ZREVRANGEBYSCORE key max min [WITHSCORES] [LIMIT offset count]
// ZREVRANK key member
// ZSCORE key member
// ZUNIONSTORE destination numkeys key [key ...] [WEIGHTS weight [weight ...]] [AGGREGATE SUM|MIN|MAX]



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
			redis.__log(0,'console.debug argument['+i+'] = ' + console.pretifyJSON(arguments[i]));
	},
	info: function(){
		for(var i=0; i<arguments.length; i++)
			redis.__log(1,'console.info argument['+i+'] = ' + console.pretifyJSON(arguments[i]));
	},
	log: function(){
		for(var i=0; i<arguments.length; i++)
			redis.__log(2,'console.log argument['+i+'] = ' + console.pretifyJSON(arguments[i]));
	},
	warn: function(){
		for(var i=0; i<arguments.length; i++)
			redis.__log(3,'console.warn argument['+i+'] = ' + console.pretifyJSON(arguments[i]));
	}
};

