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
	var commands = redis._runcounter;
	var ret = inline_redis_func();
	if(ret === undefined) ret = null;
	if(ret === false) return redis.last_error;
	var ret_obj = {ret:ret,cmds:redis._runcounter-commands};
	return JSON.stringify(ret_obj);
}

redis.v8stats = function(){
	return JSON.stringify({
		command_processed: redis._runcounter,
		ops_per_second: Math.floor(redis._runcounter/((+new Date - redis.v8_start)/1000))
	});
}

/* standart redis functions */

redis.append = function(key,value){
	return this._run('APPEND',key,value);
}

redis.bgrewriteaof = function(){
	return this._run('BGREWRITEAOF');
}

redis.bgsave = function(){
	return this._run('BGSAVE');
}
// BITCOUNT key [start] [end]
// BITOP operation destkey key [key ...]
// BLPOP key [key ...] timeout
// BRPOP key [key ...] timeout

redis.brpoplpush = function(source,destination,timeout){
	return this._run('BRPOPLPUSH',source,destination,timeout);
}

redis.client_kill = function(ip_port){
	return this._run('CLIENT','KILL',ip_port);
}

redis.client_list = function(){
	return this._run('CLIENT','LIST');
}

redis.client_getname = function(){
	return this._run('CLIENT','GETNAME');
}

redis.client_setname = function(name){
	return this._run('CLIENT','SETNAME',name);
}

redis.config_get = function(parameter){
	return this._run('CONFIG','GET',parameter);
}

redis.config_set = function(parameter,value){
	return this._run('CONFIG','SET',parameter,value);
}

redis.config_resetstat = function(){
	return this._run('CONFIG','RESETSTAT');
}

redis.dbsize = function(){
	return this._run('DBSIZE');
}

redis.bgsave = function(){
	return this._run('BGSAVE');
}

redis.debug_object = function(key){
	return this._run('DEBUG','OBJECT',key);
}

redis.debug_segfault = function(){
	return this._run('DEBUG','SEGFAULT');
}

redis.decr = function(key) {
	return this._run('DECR',key);
}

redis.decrby = function(key,decrement) {
	return this._run('DECRBY',key,decrement);
}

redis.del = function(key){
	if(arguments.length>1){
		for(var i=0;i<arguments.length;i++)
			this._run('DEL',arguments[i]);
		return;
	}
	return this._run('DEL',key);
}

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

redis.echo = function(message){
	return this._run('ECHO',message);
}
// EVAL script numkeys key [key ...] arg [arg ...]
// EVALSHA sha1 numkeys key [key ...] arg [arg ...]

redis.exists = function(key){
	return this._run('EXISTS',key);
}

redis.expire = function(key,seconds){
	return this._run('EXPIRE',key,seconds);
}

redis.expireat = function(key,timestamp){
	return this._run('EXPIREAT',key,timestamp);
}

redis.flushall = function(){
	return this._run('FLUSHALL');
}

redis.flushdb = function(){
	return this._run('FLUSHDB');
}

redis.get = function(key){
	redis._runcounter++;
	redis.last_error = '';
	redis.str = redis.__run('GET',key);
	if(redis.str===false){
		redis.last_error = redis.getLastError();
	}
	return redis.str;
}

redis.getbit = function(key,offset){
	return this._run('GETBIT',key,offset);
}

redis.getrange = function(key,start,end){
	return this._run('GETRANGE',key,start,end);
}

redis.getset = function(key,value){
	return this._run('GETSET',key,value);
}

// HDEL key field [field ...]

redis.hexists = function(key,field){
	return this._run('HEXISTS',key,field);
}

redis.hget = function(key,field){
	return this._run('HGET',key,field);
}

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

redis.hincrby = function(key,field,increment){
	return this._run('HINCRBY',key,field,increment)
}

redis.hincrbyfloat = function(key,field,increment){
	return this._run('HINCRBYFLOAT',key,field,increment);
}

redis.hkeys = function(key){
	return this._run('HKEYS',key);
}

redis.hlen = function(key){
	return this._run('HLEN',key);
}

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

redis.hmset = function(key, obj){
	var f = ['HMSET',key];
	for(var k in obj){
		f.push(k);
		f.push(obj[k]);
	}
	return this._run.apply(this,f);
}

redis.hset = function(key,field,value){
	return this._run('HSET',key,field,value);
}

redis.hsetnx = function(key,field,value){
	return this._run('HSETNX',key,field,value);
}

redis.hvals = function(key){
	return this._run('HVALS',key);
}

redis.incr = function(key){
	return this._run('INCR',key);
}

redis.incrby = function(key,increment){
	return this._run('INCRBY',key,increment);
}

redis.incrbyfloat = function(key,increment){
	return this._run('INCRBYFLOAT',key,increment);
}

// INFO [section]

redis.keys = function(pattern){
	return this._run('KEYS',pattern);
}

redis.lastsave = function(){
	return this._run('LASTSAVE');
}

redis.lindex = function(key,index){
	return this._run('LINDEX',key,index);
}

// LINSERT key BEFORE|AFTER pivot value

redis.llen = function(key){
	return this._run('LLEN',key);
}

redis.lpop = function(key){
	return this._run('LPOP',key);
}
// LPUSH key value [value ...]
redis.lpush = function(key,value){
	return this._run('LPUSH',key,value);
}

redis.lpushhx = function(key,value){
	return this._run('LPUSHX',key,value);
}

redis.lrange = function(key,start,stop){
	return this._run('LRANGE',key,start,stop);
}

redis.lrem = function(key,count,value){
	return this._run('LREM',key,count,value);
}

redis.lset = function(key,index,value){
	return this._run('LSET',key,index,value);
}

redis.ltrim = function(key,start,stop){
	return this._run('LTRIM',key,start,stop);
}

// MGET key [key ...]
// MIGRATE host port key destination-db timeout

redis.move = function(key,db){
	return this._run('MOVE',key,db);
}

// MSET key value [key value ...]
// MSETNX key value [key value ...]
// OBJECT subcommand [arguments [arguments ...]]

redis.persist = function(key){
	return this._run('PERSIST',key);
}

redis.pexpire = function(key,milliseconds){
	return this._run('PEXPIRE',key,milliseconds);
}

redis.pexpireat = function(key,milliseconds){
	return this._run('PEXPIREAT',key,milliseconds);
}

redis.ping = function(){
	return this._run('PING');
}

redis.psetex = function(key,milliseconds,value){
	return this._run('PSETEX',key,milliseconds,value);
}

redis.pttl = function(key){
	return this._run('PTTL',key);
}

redis.randomkey = function(){
	return this._run('RANDOMKEY');
}

redis.rename = function(key,newkey){
	return this._run('RENAME',key,newkey);
}

redis.renamenx = function(key,newkey){
	return this._run('RENAMENX',key,newkey);
}
// RESTORE key ttl serialized-value

redis.rpop = function(key){
	return this._run('RPOP',key);
}
// RPOPLPUSH source destination
// RPUSH key value [value ...]

redis.rpushx = function(key,value){
	return this._run('RPUSHX',key,value);
}
// SADD key member [member ...]

redis.save = function(){
	return this._run('SAVE');
}

redis.scard = function(key){
	return this._run('SCARD',key);
}
// SCRIPT EXISTS script [script ...]
// SCRIPT FLUSH
// SCRIPT KILL
// SCRIPT LOAD script
// SDIFF key [key ...]
// SDIFFSTORE destination key [key ...]

redis.select = function(index){
	return this._run('SELECT',index);
}
// SET key value [EX seconds] [PX milliseconds] [NX|XX]
redis.set = function(key,value){
	if(arguments.length>2){
		var args = [];
		args = Array(arguments.length+1);
		args[0] = 'SET';
		for(var i=0;i<arguments.length;i++)
			args[i+1] = arguments[i];
		return this._run.apply(this,args);
	}
	redis._runcounter++;
	redis.last_error = '';
	redis.str = redis.__run('SET',key,value);
	if(redis.str===false){
		redis.last_error = redis.getLastError();
	}
	return redis.str;
}

redis.setbit = function(key,offset,value){
	return this._run('SETBIT',key,offset,value);
}

redis.setex = function(key,expire,value){
	return this._run('SETEX',key,expire,value);
}

redis.setnx = function(key,value){
	return this._run('SETNX',key,value);
}

redis.setrange = function(key,offset,value){
	return this._run('SETRANGE',key,offset,value);
}
// SHUTDOWN [NOSAVE] [SAVE]
// SINTER key [key ...]
// SINTERSTORE destination key [key ...]

redis.sismember = function(key,member){
	return this._run('SISMEMBER',key,member);
}
// SLOWLOG subcommand [argument]

redis.smembers = function(key){
	return this._run('SMEMBERS',key);
}

redis.smove = function(source,destination,member){
	return this._run('SMOVE',source,destination,member);
}
// SORT key [BY pattern] [LIMIT offset count] [GET pattern [GET pattern ...]] [ASC|DESC] [ALPHA] [STORE destination]

redis.spop = function(key){
	return this._run('SPOP',key);
}
// SRANDMEMBER key [count]
// SREM key member [member ...]

redis.strlen = function(key){
	return this._run('STRLEN',key);
}
// SUBSCRIBE channel [channel ...]
// SUNION key [key ...]
// SUNIONSTORE destination key [key ...]

redis.sync = function(){
	return this._run('SYNC');
}

redis.time = function(){
	return this._run('TIME');
}

redis.ttl = function(key){
	return this._run('TTL',key);
}

redis.type = function(key){
	return this._run('TYPE',key);
}

redis.zadd = function(key,score,value){
	if(arguments.length>2){
		var args = [];
		args = Array(arguments.length+1);
		args[0] = 'ZADD';
		for(var i=0;i<arguments.length;i++)
			args[i+1] = arguments[i];
		return this._run.apply(this,args);
	}
	return this._run('ZADD',key,score,value);
}

redis.zcard = function(key){
	return this._run('ZCARD',key);
}

redis.zcount = function(key,min,max){
	return this._run('ZCOUNT',key,min,max);
}

redis.zincrby = function(key,increment,member){
	return this._run('ZINCRBY',key,increment,member);
}

// ZINTERSTORE destination numkeys key [key ...] [WEIGHTS weight [weight ...]] [AGGREGATE SUM|MIN|MAX]
// ZRANGE key start stop [WITHSCORES]
redis.zrange = function(key,start,stop){
	if(typeof withscores != 'undefined')
		return this._run('ZRANGE',key,start,stop,'WITHSCORES');
	return this._run('ZRANGE',key,start,stop);
}
// ZRANGEBYSCORE key min max [WITHSCORES] [LIMIT offset count]

redis.zrank = function(key,member){
	return this._run('ZRANK',key,member);
}

redis.zrem = function(key,value){
	if(arguments.length>2){
		var args = [];
		args = Array(arguments.length+1);
		args[0] = 'ZREM';
		for(var i=0;i<arguments.length;i++)
			args[i+1] = arguments[i];
		return this._run.apply(this,args);
	}
	return this._run('ZREM',key,value);
}


redis.zremrangebyrank = function(key,start,stop){
	return this._run('ZREMRANGEBYRANK',key,start,stop);
}

redis.zremrangebyscore = function(key,min,max){
	return this._run('ZREMRANGEBYSCORE',key,min,max);
}

redis.zrevrange = function(key,start,stop,withscores){
	if(typeof withscores != 'undefined')
		return this._run('ZREVRANGE',key,start,stop,'WITHSCORES');
	return this._run('ZREVRANGE',key,start,stop);
}
// ZREVRANGEBYSCORE key max min [WITHSCORES] [LIMIT offset count]

redis.zrevrank = function(key,member){
	return this._run('ZREVRANK',key,member);
}

redis.zscore = function(key,member){
	return this._run('ZSCORE',key,member);
}
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