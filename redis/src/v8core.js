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

window = this;

function jscall_wrapper_function(){
	var self, func;

	self = window;
	func = eval('('+arguments[0]+')');
	if(typeof func != 'function'){
		redis.last_error = '-Function "'+arguments[0]+'" not found';
		return redis.last_error;
	}
	var funcname = arguments[0].split('.');
	funcname.pop();
	if(funcname.length>0){
		self = eval('('+funcname.join('.')+')');
	}

	var args = Array(arguments.length-1);
	for(var i=0;i<arguments.length-1;i++){
		args[i] = arguments[i+1];
	}
	var commands = redis._runcounter;
	var ret = func.apply(self,args)
	if(ret === undefined) ret = null;
	if(ret === false) return redis.last_error;
	var ret_obj = {ret:ret,cmds:redis._runcounter-commands};
	return JSON.stringify(ret_obj);
}

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

/* 
* standart redis functions 
* you can find info on http://redis.io/commands
* some commands like PUBLISH SUBSCRIPE MONITOR are omited
* if some command missing you can use redis._run("missing_command","arg1","arg2")
*/

redis.append = function(key,value){
	return this._run('APPEND',key,value);
}

redis.bgrewriteaof = function(){
	return this._run('BGREWRITEAOF');
}

redis.bgsave = function(){
	return this._run('BGSAVE');
}

redis.bitcount = function(key){
	if(arguments.length==1){
		return this._run('BITCOUNT',key);
	}
	var args = Array(arguments.length+1);
	args[0] = 'BITCOUNT';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

redis.bitop = function(operation,destkey,key){
	if(arguments.length==3){
		return this._run('BITOP',operation,destkey,key);
	}
	var args = Array(arguments.length+1);
	args[0] = 'BITOP';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

redis.blpop = function(key,timeout){
	if(arguments.length==2){
		return this._run('BLPOP',key,timeout);
	}
	var args = Array(arguments.length+1);
	args[0] = 'BLPOP';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

redis.brpop = function(key,timeout){
	if(arguments.length==2){
		return this._run('BRPOP',key,timeout);
	}
	var args = Array(arguments.length+1);
	args[0] = 'BRPOP';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

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
	redis._runcounter++;
	redis.last_error = '';
	return this.__incrby(key,-1);
}

redis.decrby = function(key,decrement) {
	redis._runcounter++;
	redis.last_error = '';
	return this.__incrby(key,-decrement);
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

redis.eval = function(){
	var args = Array(arguments.length+1);
	args[0] = 'EVAL';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

redis.evalsha = function(){
	var args = Array(arguments.length+1);
	args[0] = 'EVALSHA';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

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

redis._get = function(key) {
	redis._runcounter++;
	redis.last_error = '';
	redis.str = redis.__run('GET',key);
	if(redis.str===false){
		redis.last_error = redis.getLastError();
	}
	return redis.str;
}

redis.get = function(key){
	if(typeof key != 'string' || key.length<1){
		return this._get(key);
	}
	redis._runcounter++;
	redis.last_error = '';
	return this.__get(key);
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

redis.hdel = function(key,field){
	if(arguments.length==2){
		return this._run('HDEL',key,field);
	}
	var args = Array(arguments.length+1);
	args[0] = 'HDEL';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

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
	redis._runcounter++;
	redis.last_error = '';
	return this.__incrby(key,1);
}

redis.incrby = function(key,increment){
	redis._runcounter++;
	redis.last_error = '';
	return this.__incrby(key,increment);
}

redis.incrbyfloat = function(key,increment){
	return this._run('INCRBYFLOAT',key,increment);
}

redis.info = function(){
	if(arguments.length==0){
		return this._run('INFO');
	}
	var args = Array(arguments.length+1);
	args[0] = 'INFO';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

redis.keys = function(pattern){
	return this._run('KEYS',pattern);
}

redis.lastsave = function(){
	return this._run('LASTSAVE');
}

redis.lindex = function(key,index){
	return this._run('LINDEX',key,index);
}

redis.linsert = function(key,before_after,pivot,value){
	return this._run('LINSERT',key,before_after,pivot,value);
}

redis.llen = function(key){
	return this._run('LLEN',key);
}

redis.lpop = function(key){
	return this._run('LPOP',key);
}

redis.lpush = function(key,value){
	if(arguments.length==2){
		return this._run('LPUSH',key,value);
	}
	var args = Array(arguments.length+1);
	args[0] = 'LPUSH';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
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

redis.mget = function(key){
	if(arguments.length==1){
		return this._run('MGET',key);
	}
	var args = Array(arguments.length+1);
	args[0] = 'MGET';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}
// MIGRATE host port key destination-db timeout
redis.migrate = function(){
	this.last_error = 'not supported yet';
	return false;
}

redis.move = function(key,db){
	return this._run('MOVE',key,db);
}

redis.mset = function(key,value){
	if(arguments.length==2){
		return this._run('MSET',key,value);
	}
	var args = Array(arguments.length+1);
	args[0] = 'MSET';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

redis.msetnx = function(key,value){
	if(arguments.length==2){
		return this._run('MSETNX',key,value);
	}
	var args = Array(arguments.length+1);
	args[0] = 'MSETNX';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

redis.object = function(subcommand){
	if(arguments.length==1){
		return this._run('OBJECT',subcommand);
	}
	var args = Array(arguments.length+1);
	args[0] = 'OBJECT';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

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
redis.restore = function(key,ttl,serialized_value){
	redis.last_error = 'cant handle binary data, not implemented yet';
	return false;
}

redis.rpop = function(key){
	return this._run('RPOP',key);
}

redis.rpoplpush = function(source,destination){
	return this._run('RPOPLPUSH',source,destination);
}

redis.rpush = function(key,value){
	if(arguments.length==2){
		return this._run('RPUSH',key,value);
	}
	var args = Array(arguments.length+1);
	args[0] = 'RPUSH';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

redis.rpushx = function(key,value){
	return this._run('RPUSHX',key,value);
}

redis.sadd = function(key,member){
	if(arguments.length==2){
		return this._run('SADD',key,value);
	}
	var args = Array(arguments.length+1);
	args[0] = 'SADD';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

redis.save = function(){
	return this._run('SAVE');
}

redis.scard = function(key){
	return this._run('SCARD',key);
}

redis.script_exists = function(script){
	if(arguments.length==1){
		return this._run('SCRIPT','EXISTS',script);
	}
	var args = Array(arguments.length+2);
	args[0] = 'SCRIPT';
	args[1] = 'EXISTS';
	for(var i=0;i<arguments.length;i++)
		args[i+2] = arguments[i];
	return this._run.apply(this,args);
}

redis.script_flush = function(){
	return this._run('SCRIPT','FLUSH');
}

redis.script_kill = function(){
	return this._run('SCRIPT','KILL');
}

redis.script_load = function(script){
	return this._run('SCRIPT','LOAD',script);
}

redis.sdiff = function(key){
	if(arguments.length==1){
		return this._run('SDIFF',key);
	}
	var args = Array(arguments.length+1);
	args[0] = 'SDIFF';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

redis.sdiffstore = function(destination,key){
	if(arguments.length==2){
		return this._run('SDIFFSTORE',destination,key);
	}
	var args = Array(arguments.length+1);
	args[0] = 'SDIFFSTORE';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

redis.select = function(index){
	return this._run('SELECT',index);
}

redis._set = function(key,value){
	if(arguments.length>2){
		var args = Array(arguments.length+1);
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
// SET key value [EX seconds] [PX milliseconds] [NX|XX]
redis.set = function(key,value){
	if(arguments.length>2 || typeof key != 'string' || typeof value != 'string')
		return this._set.apply(this,arguments);
	redis._runcounter++;
	redis.last_error = '';
	return this.__set(key,value);
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

redis.shutdown = function(){
	if(arguments.length==1){
		return this._run('SHUTDOWN');
	}
	var args = Array(arguments.length+1);
	args[0] = 'SHUTDOWN';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

redis.sinter = function(key){
	if(arguments.length==1){
		return this._run('SINTER',key);
	}
	var args = Array(arguments.length+1);
	args[0] = 'SINTER';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

redis.sinterstore = function(destination,key){
	if(arguments.length==2){
		return this._run('SINTERSTORE',destination,key);
	}
	var args = Array(arguments.length+1);
	args[0] = 'SINTERSTORE';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

redis.sismember = function(key,member){
	return this._run('SISMEMBER',key,member);
}

redis.slowlog = function(subcommand){
	if(arguments.length==1){
		return this._run('SLOWLOG',subcommand);
	}
	var args = Array(arguments.length+1);
	args[0] = 'SLOWLOG';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

redis.smembers = function(key){
	return this._run('SMEMBERS',key);
}

redis.smove = function(source,destination,member){
	return this._run('SMOVE',source,destination,member);
}

redis.sort = function(key){
	if(arguments.length==1){
		return this._run('SORT',key);
	}
	var args = Array(arguments.length+1);
	args[0] = 'SORT';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

redis.spop = function(key){
	return this._run('SPOP',key);
}

redis.srandmember = function(key,count){
	if(argument.length==1)
		return this._run('SRANDMEMBER',key);
	return this._run('SRANDMEMBER',key,count);
}

redis.srem = function(key,member){
	if(arguments.length==2){
		return this._run('SREM',key,value);
	}
	var args = Array(arguments.length+1);
	args[0] = 'SREM';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

redis.strlen = function(key){
	return this._run('STRLEN',key);
}

redis.sunion = function(key){
	if(arguments.length==1){
		return this._run('SUNION',key);
	}
	var args = Array(arguments.length+1);
	args[0] = 'SUNION';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

redis.sunionstore = function(destination,key){
	if(arguments.length==2){
		return this._run('SUNIONSTORE',destination,key);
	}
	var args = Array(arguments.length+1);
	args[0] = 'SUNIONSTORE';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

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
		var args = Array(arguments.length+1);
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

redis.zinterstore = function(destination,numkeys,key){
	if(arguments.length==3){
		return this._run('ZINTERSTORE',destination,numkeys,key);
	}
	var args = Array(arguments.length+1);
	args[0] = 'ZUNIONSTORE';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

redis.zrange = function(key,start,stop,withscores){
	if(arguments.length==4)
		return this._run('ZRANGE',key,start,stop,'WITHSCORES');
	return this._run('ZRANGE',key,start,stop);
}

redis.zrangebyscore = function(key,min,max){
	if(arguments.length==3){
		return this._run('ZRANGEBYSCORE',key,min,max);
	}
	var args = Array(arguments.length+1);
	args[0] = 'ZRANGEBYSCORE';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

redis.zrank = function(key,member){
	return this._run('ZRANK',key,member);
}

redis.zrem = function(key,value){
	if(arguments.length>2){
		var args = Array(arguments.length+1);
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

redis.zrevrangebyscore = function(key,min,max){
	if(arguments.length==3){
		return this._run('ZREVRANGEBYSCORE',key,min,max);
	}
	var args = Array(arguments.length+1);
	args[0] = 'ZREVRANGEBYSCORE';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

redis.zrevrank = function(key,member){
	return this._run('ZREVRANK',key,member);
}

redis.zscore = function(key,member){
	return this._run('ZSCORE',key,member);
}

redis.zunionstore = function(destination,numkeys,key){
	if(arguments.length==3){
		return this._run('ZUNIONSTORE',destination,numkeys,key);
	}
	var args = Array(arguments.length+1);
	args[0] = 'ZUNIONSTORE';
	for(var i=0;i<arguments.length;i++)
		args[i+1] = arguments[i];
	return this._run.apply(this,args);
}

/* Redis Log levels
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