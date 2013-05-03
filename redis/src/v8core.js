/*
 * Copyright (c) 2013, Arseniy Pavlenko <h0x91b@gmail.com>
 * All rights reserved.
 * Copyright (c) 2009-2012, Salvatore Sanfilippo <antirez at gmail dot com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *   * Redistributions of source code must retain the above copyright notice,
 *     this list of conditions and the following disclaimer.
 *   * Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *   * Neither the name of Redis nor the names of its contributors may be used
 *     to endorse or promote products derived from this software without
 *     specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
redis.str = {};
redis.last_error = '';
redis.v8_start = +new Date;
redis._runcounter = 0;

redis._run = function(){
	redis._runcounter++;
	redis.last_error = '';
	redis.str = redis.__run.apply(this,arguments);
	if(redis.str===false){
		redis.last_error = redis.getLastError();
	}
	return redis.str;
}

redis.inline_return = function(){
	var ret = inline_redis_func();
	if(ret === undefined) ret = null;
	if(ret === false) return redis.last_error;
	var ret_obj = {ret:ret};
	return JSON.stringify(ret_obj);
}

redis.v8stats = function(){
	return JSON.stringify({
		command_processed: redis._runcounter,
		ops_per_second: Math.floor(redis._runcounter/((+new Date - redis.v8_start)/1000))
	});
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
redis.client_list = function(list){
	return this.run('CLIENT','LIST');
}
// CLIENT GETNAME
// CLIENT SETNAME connection-name
// CONFIG GET parameter
// CONFIG SET parameter value
// CONFIG RESETSTAT
// DBSIZE
redis.dbsize = function(){
	return redis.run('DBSIZE');
}
// BGSAVE
// DEBUG OBJECT key
// DEBUG SEGFAULT
// DECR key
redis.decr = function(key) {
	return this.run('DECR',key);
}
// DECRBY key decrement
redis.decrby = function(key,decrement) {
	return this.run('DECRBY',key,decrement);
}
// DEL key [key ...]
redis.del = function(key){
	if(arguments.length>1){
		for(var i=0;i<arguments.length;i++)
			this.run('DEL',arguments[i]);
		return;
	}
	return this.run('DEL',key);
}
// DUMP key
redis.dump = function(key){
	redis.last_error = 'cant handle binary data, not implemented yet';
	return false;
	
	redis._runcounter++;
	redis.last_error = '';
	var rez = this.__run('dump',key);
	rez = rez.map(function(char){
		return escape(String.fromCharCode(char));
	})
	return rez.join('');
}
// ECHO message
redis.echo = function(message){
	return redis.run('ECHO',message);
}
// EVAL script numkeys key [key ...] arg [arg ...]
// EVALSHA sha1 numkeys key [key ...] arg [arg ...]
// EXISTS key
redis.exists = function(key){
	return this.run('EXISTS',key);
}
// EXPIRE key seconds
// EXPIREAT key timestamp
// FLUSHALL
redis.flushall = function(){
	return redis.run('FLUSHALL');
}
// FLUSHDB
redis.flushdb = function(){
	return redis.run('FLUSHDB');
}
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
	redis._runcounter++;
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
redis.hkeys = function(key){
	return this.run('HKEYS',key);
}
// HLEN key
redis.hlen = function(key){
	return this.run('HLEN',key);
}
// HMGET key field [field ...]
redis.hmget = function(key,fields){
	redis._runcounter++;
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
redis.hvals = function(key){
	return this.run('HVALS',key);
}
// INCR key
redis.incr = function(key){
	return this.run('INCR',key);
}
// INCRBY key increment
// INCRBYFLOAT key increment
// INFO [section]
// KEYS pattern
redis.keys = function(pattern){
	return this.run('KEYS',pattern);
}
// LASTSAVE
redis.lastsave = function(){
	return redis.run('LASTSAVE');
}
// LINDEX key index
// LINSERT key BEFORE|AFTER pivot value
// LLEN key
redis.llen = function(key){
	return this.run('LLEN',key);
}
// LPOP key
redis.lpop = function(key){
	return this.run('LPOP',key);
}
// LPUSH key value [value ...]
redis.lpush = function(key,value){
	return this.run('LPUSH',key,value);
}
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
// OBJECT subcommand [arguments [arguments ...]]
// PERSIST key
redis.persist = function(key){
	return this.run('PERSIST',key);
}
// PEXPIRE key milliseconds
// PEXPIREAT key milliseconds-timestamp
// PING
redis.ping = function(){
	return this.run('PING');
}
// PSETEX key milliseconds value
// PTTL key
redis.pttl = function(key){
	return this.run('PTTL',key);
}
// RANDOMKEY
redis.randomkey = function(){
	return redis.run('RANDOMKEY');
}
// RENAME key newkey
// RENAMENX key newkey
// RESTORE key ttl serialized-value
// RPOP key
redis.rpop = function(key){
	return this.run('RPOP',key);
}
// RPOPLPUSH source destination
// RPUSH key value [value ...]
// RPUSHX key value
// SADD key member [member ...]
// SAVE
redis.save = function(){
	return redis.run('SAVE');
}
// SCARD key
redis.scard = function(key){
	return this.run('SCARD',key);
}
// SCRIPT EXISTS script [script ...]
// SCRIPT FLUSH
// SCRIPT KILL
// SCRIPT LOAD script
// SDIFF key [key ...]
// SDIFFSTORE destination key [key ...]
// SELECT index
redis.select = function(index){
	return this.run('SELECT',index);
}
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
redis.smembers = function(key){
	return this.run('SMEMBERS',key);
}
// SMOVE source destination member
// SORT key [BY pattern] [LIMIT offset count] [GET pattern [GET pattern ...]] [ASC|DESC] [ALPHA] [STORE destination]
// SPOP key
redis.spop = function(key){
	return this.run('SPOP',key);
}
// SRANDMEMBER key [count]
// SREM key member [member ...]
// STRLEN key
redis.strlen = function(key){
	return this.run('STRLEN',key);
}
// SUBSCRIBE channel [channel ...]
// SUNION key [key ...]
// SUNIONSTORE destination key [key ...]
// SYNC
redis.sync = function(){
	return redis.run('SYNC');
}
// TIME
redis.time = function(){
	return redis.run('TIME');
}
// TTL key
redis.ttl = function(key){
	return this.run('TTL',key);
}
// TYPE key
redis.type = function(key){
	return this.run('TYPE',key);
}
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
redis.zcard = function(key){
	return this.run('ZCARD',key);
}
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

//