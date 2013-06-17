/*
 * Copyright (c) 2013, Arseniy Pavlenko <h0x91b@gmail.com>
 * All rights reserved.
 * Copyright (c) 2009-2012, Salvatore Sanfilippo <antirez at gmail dot com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *	 * Redistributions of source code must retain the above copyright notice,
 *		 this list of conditions and the following disclaimer.
 *	 * Redistributions in binary form must reproduce the above copyright
 *		 notice, this list of conditions and the following disclaimer in the
 *		 documentation and/or other materials provided with the distribution.
 *	 * Neither the name of Redis nor the names of its contributors may be used
 *		 to endorse or promote products derived from this software without
 *		 specific prior written permission.
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
redis._timeouts = [];
redis._timeout_id = 1;

window = this;

redis._runtimeouts = function(){
	if(redis._timeouts.length==0) return true;
	if(redis._timeouts[0].time > +new Date) return true;
	var obj = redis._timeouts.shift();
	obj.func.call(window);
	return redis._runtimeouts();
}

function setTimeout(func,delay_ms){
	var target_time = (+new Date)+delay_ms;
	var id = redis._timeout_id++;
	redis._timeouts.push({
		id: id,
		func: func,
		time: target_time
	});
	redis._timeouts.sort(function(a,b){
		if(a.time==b.time) return 0;
		return a.time > b.time ? 1 : -1;
	})
	return id;
}

function clearTimeout(id){
	if(!id || typeof id != 'number' || redis._timeouts.length < 1) return false;
	for(var i=0;i<redis._timeouts.length;i++){
		if(redis._timeouts[i].id==id){
			redis._timeouts.splice(i,1);
			break;
		}
	}
}

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
	if(typeof key != 'string' || key.length<1){
		redis.last_error = '-Not specified key';
		return false;
	}
	redis._runcounter++;
	redis.last_error = '';
	redis.str = this.__incrby(key,-1);
	if(redis.str===false){
		redis.last_error = redis.getLastError();
	}
	return redis.str;
}

redis.decrby = function(key,decrement) {
	if(typeof key != 'string' || key.length<1){
		redis.last_error = '-Not specified key';
		return false;
	}
	redis._runcounter++;
	redis.last_error = '';
	redis.str = this.__incrby(key,-decrement);
	if(redis.str===false){
		redis.last_error = redis.getLastError();
	}
	return redis.str;
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
	if(typeof key != 'string' || key.length<1){
		redis.last_error = '-Not specified key';
		return false;
	}
	redis._runcounter++;
	redis.last_error = '';
	redis.str = this.__incrby(key,1);
	if(redis.str===false){
		redis.last_error = redis.getLastError();
	}
	return redis.str;
}

redis.incrby = function(key,increment){
	if(typeof key != 'string' || key.length<1){
		redis.last_error = '-Not specified key';
		return false;
	}
	redis._runcounter++;
	redis.last_error = '';
	redis.str = this.__incrby(key,increment);
	if(redis.str===false){
		redis.last_error = redis.getLastError();
	}
	return redis.str;
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

redis.benchmark = {
	get: function(key){
		return redis.__get(key);
	},
	get100: function(key){
		var loop = 100;
		var rez = Array(100);
		while(--loop >= 0){
			rez[loop] = redis.__get(key);
		}
		return rez;
	},
	get300: function(key){
		var loop = 300;
		var rez = Array(300);
		while(--loop >= 0){
			rez[loop] = redis.__get(key);
		}
		return rez;
	},
	set: function(key,value){
		return redis.__set(key,value);
	},
	set100: function(key,value){
		var loop = 100;
		var rez = Array(100);
		while(--loop >= 0){
			rez[loop] = redis.__set(key,value);
		}
		return rez;
	},
	set300: function(key,value){
		var loop = 300;
		var rez = Array(300);
		while(--loop >= 0){
			rez[loop] = redis.__set(key,value);
		}
		return rez;
	},
	incr: function(key){
		return redis.__incrby(key,1);
	},
	incr100: function(key){
		var loop = 100;
		var rez = Array(100);
		while(--loop >= 0){
			rez[loop] = redis.__incrby(key,1);
		}
		return rez;
	},
	incr300: function(key){
		var loop = 300;
		var rez = Array(300);
		while(--loop >= 0){
			rez[loop] = redis.__incrby(key,1);
		}
		return rez;
	},
}

//helpers
function date (format, timestamp) {
	// http://kevin.vanzonneveld.net
	// +	 original by: Carlos R. L. Rodrigues (http://www.jsfromhell.com)
	// +			parts by: Peter-Paul Koch (http://www.quirksmode.org/js/beat.html)
	// +	 improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +	 improved by: MeEtc (http://yass.meetcweb.com)
	// +	 improved by: Brad Touesnard
	// +	 improved by: Tim Wiel
	// +	 improved by: Bryan Elliott
	//
	// +	 improved by: Brett Zamir (http://brett-zamir.me)
	// +	 improved by: David Randall
	// +			input by: Brett Zamir (http://brett-zamir.me)
	// +	 bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +	 improved by: Brett Zamir (http://brett-zamir.me)
	// +	 improved by: Brett Zamir (http://brett-zamir.me)
	// +	 improved by: Theriault
	// +	derived from: gettimeofday
	// +			input by: majak
	// +	 bugfixed by: majak
	// +	 bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +			input by: Alex
	// +	 bugfixed by: Brett Zamir (http://brett-zamir.me)
	// +	 improved by: Theriault
	// +	 improved by: Brett Zamir (http://brett-zamir.me)
	// +	 improved by: Theriault
	// +	 improved by: Thomas Beaucourt (http://www.webapp.fr)
	// +	 improved by: JT
	// +	 improved by: Theriault
	// +	 improved by: Rafał Kukawski (http://blog.kukawski.pl)
	// +	 bugfixed by: omid (http://phpjs.org/functions/380:380#comment_137122)
	// +			input by: Martin
	// +			input by: Alex Wilson
	// +	 bugfixed by: Chris (http://www.devotis.nl/)
	// %				note 1: Uses global: php_js to store the default timezone
	// %				note 2: Although the function potentially allows timezone info (see notes), it currently does not set
	// %				note 2: per a timezone specified by date_default_timezone_set(). Implementers might use
	// %				note 2: this.php_js.currentTimezoneOffset and this.php_js.currentTimezoneDST set by that function
	// %				note 2: in order to adjust the dates in this function (or our other date functions!) accordingly
	// *		 example 1: date('H:m:s \\m \\i\\s \\m\\o\\n\\t\\h', 1062402400);
	// *		 returns 1: '09:09:40 m is month'
	// *		 example 2: date('F j, Y, g:i a', 1062462400);
	// *		 returns 2: 'September 2, 2003, 2:26 am'
	// *		 example 3: date('Y W o', 1062462400);
	// *		 returns 3: '2003 36 2003'
	// *		 example 4: x = date('Y m d', (new Date()).getTime()/1000);
	// *		 example 4: (x+'').length == 10 // 2009 01 09
	// *		 returns 4: true
	// *		 example 5: date('W', 1104534000);
	// *		 returns 5: '53'
	// *		 example 6: date('B t', 1104534000);
	// *		 returns 6: '999 31'
	// *		 example 7: date('W U', 1293750000.82); // 2010-12-31
	// *		 returns 7: '52 1293750000'
	// *		 example 8: date('W', 1293836400); // 2011-01-01
	// *		 returns 8: '52'
	// *		 example 9: date('W Y-m-d', 1293974054); // 2011-01-02
	// *		 returns 9: '52 2011-01-02'
		var that = this,
			jsdate,
			f,
			formatChr = /\\?([a-z])/gi,
			formatChrCb,
			// Keep this here (works, but for code commented-out
			// below for file size reasons)
			//, tal= [],
			_pad = function (n, c) {
				n = n.toString();
				return n.length < c ? _pad('0' + n, c, '0') : n;
			},
			txt_words = ["Sun", "Mon", "Tues", "Wednes", "Thurs", "Fri", "Satur", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	formatChrCb = function (t, s) {
		return f[t] ? f[t]() : s;
	};
	f = {
		// Day
		d: function () { // Day of month w/leading 0; 01..31
			return _pad(f.j(), 2);
		},
		D: function () { // Shorthand day name; Mon...Sun
			return f.l().slice(0, 3);
		},
		j: function () { // Day of month; 1..31
			return jsdate.getDate();
		},
		l: function () { // Full day name; Monday...Sunday
			return txt_words[f.w()] + 'day';
		},
		N: function () { // ISO-8601 day of week; 1[Mon]..7[Sun]
			return f.w() || 7;
		},
		S: function(){ // Ordinal suffix for day of month; st, nd, rd, th
			var j = f.j()
			i = j%10;
			if (i <= 3 && parseInt((j%100)/10) == 1) i = 0;
			return ['st', 'nd', 'rd'][i - 1] || 'th';
		},
		w: function () { // Day of week; 0[Sun]..6[Sat]
			return jsdate.getDay();
		},
		z: function () { // Day of year; 0..365
			var a = new Date(f.Y(), f.n() - 1, f.j()),
				b = new Date(f.Y(), 0, 1);
			return Math.round((a - b) / 864e5);
		},

		// Week
		W: function () { // ISO-8601 week number
			var a = new Date(f.Y(), f.n() - 1, f.j() - f.N() + 3),
				b = new Date(a.getFullYear(), 0, 4);
			return _pad(1 + Math.round((a - b) / 864e5 / 7), 2);
		},

		// Month
		F: function () { // Full month name; January...December
			return txt_words[6 + f.n()];
		},
		m: function () { // Month w/leading 0; 01...12
			return _pad(f.n(), 2);
		},
		M: function () { // Shorthand month name; Jan...Dec
			return f.F().slice(0, 3);
		},
		n: function () { // Month; 1...12
			return jsdate.getMonth() + 1;
		},
		t: function () { // Days in month; 28...31
			return (new Date(f.Y(), f.n(), 0)).getDate();
		},

		// Year
		L: function () { // Is leap year?; 0 or 1
			var j = f.Y();
			return j % 4 === 0 & j % 100 !== 0 | j % 400 === 0;
		},
		o: function () { // ISO-8601 year
			var n = f.n(),
				W = f.W(),
				Y = f.Y();
			return Y + (n === 12 && W < 9 ? 1 : n === 1 && W > 9 ? -1 : 0);
		},
		Y: function () { // Full year; e.g. 1980...2010
			return jsdate.getFullYear();
		},
		y: function () { // Last two digits of year; 00...99
			return f.Y().toString().slice(-2);
		},

		// Time
		a: function () { // am or pm
			return jsdate.getHours() > 11 ? "pm" : "am";
		},
		A: function () { // AM or PM
			return f.a().toUpperCase();
		},
		B: function () { // Swatch Internet time; 000..999
			var H = jsdate.getUTCHours() * 36e2,
				// Hours
				i = jsdate.getUTCMinutes() * 60,
				// Minutes
				s = jsdate.getUTCSeconds(); // Seconds
			return _pad(Math.floor((H + i + s + 36e2) / 86.4) % 1e3, 3);
		},
		g: function () { // 12-Hours; 1..12
			return f.G() % 12 || 12;
		},
		G: function () { // 24-Hours; 0..23
			return jsdate.getHours();
		},
		h: function () { // 12-Hours w/leading 0; 01..12
			return _pad(f.g(), 2);
		},
		H: function () { // 24-Hours w/leading 0; 00..23
			return _pad(f.G(), 2);
		},
		i: function () { // Minutes w/leading 0; 00..59
			return _pad(jsdate.getMinutes(), 2);
		},
		s: function () { // Seconds w/leading 0; 00..59
			return _pad(jsdate.getSeconds(), 2);
		},
		u: function () { // Microseconds; 000000-999000
			return _pad(jsdate.getMilliseconds() * 1000, 6);
		},

		// Timezone
		e: function () { // Timezone identifier; e.g. Atlantic/Azores, ...
			// The following works, but requires inclusion of the very large
			// timezone_abbreviations_list() function.
/*							return that.date_default_timezone_get();
*/
			throw 'Not supported (see source code of date() for timezone on how to add support)';
		},
		I: function () { // DST observed?; 0 or 1
			// Compares Jan 1 minus Jan 1 UTC to Jul 1 minus Jul 1 UTC.
			// If they are not equal, then DST is observed.
			var a = new Date(f.Y(), 0),
				// Jan 1
				c = Date.UTC(f.Y(), 0),
				// Jan 1 UTC
				b = new Date(f.Y(), 6),
				// Jul 1
				d = Date.UTC(f.Y(), 6); // Jul 1 UTC
			return ((a - c) !== (b - d)) ? 1 : 0;
		},
		O: function () { // Difference to GMT in hour format; e.g. +0200
			var tzo = jsdate.getTimezoneOffset(),
				a = Math.abs(tzo);
			return (tzo > 0 ? "-" : "+") + _pad(Math.floor(a / 60) * 100 + a % 60, 4);
		},
		P: function () { // Difference to GMT w/colon; e.g. +02:00
			var O = f.O();
			return (O.substr(0, 3) + ":" + O.substr(3, 2));
		},
		T: function () { // Timezone abbreviation; e.g. EST, MDT, ...
			// The following works, but requires inclusion of the very
			// large timezone_abbreviations_list() function.
/*							var abbr = '', i = 0, os = 0, default = 0;
			if (!tal.length) {
				tal = that.timezone_abbreviations_list();
			}
			if (that.php_js && that.php_js.default_timezone) {
				default = that.php_js.default_timezone;
				for (abbr in tal) {
					for (i=0; i < tal[abbr].length; i++) {
						if (tal[abbr][i].timezone_id === default) {
							return abbr.toUpperCase();
						}
					}
				}
			}
			for (abbr in tal) {
				for (i = 0; i < tal[abbr].length; i++) {
					os = -jsdate.getTimezoneOffset() * 60;
					if (tal[abbr][i].offset === os) {
						return abbr.toUpperCase();
					}
				}
			}
*/
			return 'UTC';
		},
		Z: function () { // Timezone offset in seconds (-43200...50400)
			return -jsdate.getTimezoneOffset() * 60;
		},

		// Full Date/Time
		c: function () { // ISO-8601 date.
			return 'Y-m-d\\TH:i:sP'.replace(formatChr, formatChrCb);
		},
		r: function () { // RFC 2822
			return 'D, d M Y H:i:s O'.replace(formatChr, formatChrCb);
		},
		U: function () { // Seconds since UNIX epoch
			return jsdate / 1000 | 0;
		}
	};
	this.date = function (format, timestamp) {
		that = this;
		jsdate = (timestamp === undefined ? new Date() : // Not provided
			(timestamp instanceof Date) ? new Date(timestamp) : // JS Date()
			new Date(timestamp * 1000) // UNIX timestamp (auto-convert to int)
		);
		return format.replace(formatChr, formatChrCb);
	};
	return this.date(format, timestamp);
}

Crypto = {};

(function(){
	//MD5
	/*
	CryptoJS v3.1.2
	code.google.com/p/crypto-js
	(c) 2009-2013 by Jeff Mott. All rights reserved.
	code.google.com/p/crypto-js/wiki/License
	*/
	var CryptoJS=CryptoJS||function(s,p){var m={},l=m.lib={},n=function(){},r=l.Base={extend:function(b){n.prototype=this;var h=new n;b&&h.mixIn(b);h.hasOwnProperty("init")||(h.init=function(){h.$super.init.apply(this,arguments)});h.init.prototype=h;h.$super=this;return h},create:function(){var b=this.extend();b.init.apply(b,arguments);return b},init:function(){},mixIn:function(b){for(var h in b)b.hasOwnProperty(h)&&(this[h]=b[h]);b.hasOwnProperty("toString")&&(this.toString=b.toString)},clone:function(){return this.init.prototype.extend(this)}},
	q=l.WordArray=r.extend({init:function(b,h){b=this.words=b||[];this.sigBytes=h!=p?h:4*b.length},toString:function(b){return(b||t).stringify(this)},concat:function(b){var h=this.words,a=b.words,j=this.sigBytes;b=b.sigBytes;this.clamp();if(j%4)for(var g=0;g<b;g++)h[j+g>>>2]|=(a[g>>>2]>>>24-8*(g%4)&255)<<24-8*((j+g)%4);else if(65535<a.length)for(g=0;g<b;g+=4)h[j+g>>>2]=a[g>>>2];else h.push.apply(h,a);this.sigBytes+=b;return this},clamp:function(){var b=this.words,h=this.sigBytes;b[h>>>2]&=4294967295<<
	32-8*(h%4);b.length=s.ceil(h/4)},clone:function(){var b=r.clone.call(this);b.words=this.words.slice(0);return b},random:function(b){for(var h=[],a=0;a<b;a+=4)h.push(4294967296*s.random()|0);return new q.init(h,b)}}),v=m.enc={},t=v.Hex={stringify:function(b){var a=b.words;b=b.sigBytes;for(var g=[],j=0;j<b;j++){var k=a[j>>>2]>>>24-8*(j%4)&255;g.push((k>>>4).toString(16));g.push((k&15).toString(16))}return g.join("")},parse:function(b){for(var a=b.length,g=[],j=0;j<a;j+=2)g[j>>>3]|=parseInt(b.substr(j,
	2),16)<<24-4*(j%8);return new q.init(g,a/2)}},a=v.Latin1={stringify:function(b){var a=b.words;b=b.sigBytes;for(var g=[],j=0;j<b;j++)g.push(String.fromCharCode(a[j>>>2]>>>24-8*(j%4)&255));return g.join("")},parse:function(b){for(var a=b.length,g=[],j=0;j<a;j++)g[j>>>2]|=(b.charCodeAt(j)&255)<<24-8*(j%4);return new q.init(g,a)}},u=v.Utf8={stringify:function(b){try{return decodeURIComponent(escape(a.stringify(b)))}catch(g){throw Error("Malformed UTF-8 data");}},parse:function(b){return a.parse(unescape(encodeURIComponent(b)))}},
	g=l.BufferedBlockAlgorithm=r.extend({reset:function(){this._data=new q.init;this._nDataBytes=0},_append:function(b){"string"==typeof b&&(b=u.parse(b));this._data.concat(b);this._nDataBytes+=b.sigBytes},_process:function(b){var a=this._data,g=a.words,j=a.sigBytes,k=this.blockSize,m=j/(4*k),m=b?s.ceil(m):s.max((m|0)-this._minBufferSize,0);b=m*k;j=s.min(4*b,j);if(b){for(var l=0;l<b;l+=k)this._doProcessBlock(g,l);l=g.splice(0,b);a.sigBytes-=j}return new q.init(l,j)},clone:function(){var b=r.clone.call(this);
	b._data=this._data.clone();return b},_minBufferSize:0});l.Hasher=g.extend({cfg:r.extend(),init:function(b){this.cfg=this.cfg.extend(b);this.reset()},reset:function(){g.reset.call(this);this._doReset()},update:function(b){this._append(b);this._process();return this},finalize:function(b){b&&this._append(b);return this._doFinalize()},blockSize:16,_createHelper:function(b){return function(a,g){return(new b.init(g)).finalize(a)}},_createHmacHelper:function(b){return function(a,g){return(new k.HMAC.init(b,
	g)).finalize(a)}}});var k=m.algo={};return m}(Math);
	(function(s){function p(a,k,b,h,l,j,m){a=a+(k&b|~k&h)+l+m;return(a<<j|a>>>32-j)+k}function m(a,k,b,h,l,j,m){a=a+(k&h|b&~h)+l+m;return(a<<j|a>>>32-j)+k}function l(a,k,b,h,l,j,m){a=a+(k^b^h)+l+m;return(a<<j|a>>>32-j)+k}function n(a,k,b,h,l,j,m){a=a+(b^(k|~h))+l+m;return(a<<j|a>>>32-j)+k}for(var r=CryptoJS,q=r.lib,v=q.WordArray,t=q.Hasher,q=r.algo,a=[],u=0;64>u;u++)a[u]=4294967296*s.abs(s.sin(u+1))|0;q=q.MD5=t.extend({_doReset:function(){this._hash=new v.init([1732584193,4023233417,2562383102,271733878])},
	_doProcessBlock:function(g,k){for(var b=0;16>b;b++){var h=k+b,w=g[h];g[h]=(w<<8|w>>>24)&16711935|(w<<24|w>>>8)&4278255360}var b=this._hash.words,h=g[k+0],w=g[k+1],j=g[k+2],q=g[k+3],r=g[k+4],s=g[k+5],t=g[k+6],u=g[k+7],v=g[k+8],x=g[k+9],y=g[k+10],z=g[k+11],A=g[k+12],B=g[k+13],C=g[k+14],D=g[k+15],c=b[0],d=b[1],e=b[2],f=b[3],c=p(c,d,e,f,h,7,a[0]),f=p(f,c,d,e,w,12,a[1]),e=p(e,f,c,d,j,17,a[2]),d=p(d,e,f,c,q,22,a[3]),c=p(c,d,e,f,r,7,a[4]),f=p(f,c,d,e,s,12,a[5]),e=p(e,f,c,d,t,17,a[6]),d=p(d,e,f,c,u,22,a[7]),
	c=p(c,d,e,f,v,7,a[8]),f=p(f,c,d,e,x,12,a[9]),e=p(e,f,c,d,y,17,a[10]),d=p(d,e,f,c,z,22,a[11]),c=p(c,d,e,f,A,7,a[12]),f=p(f,c,d,e,B,12,a[13]),e=p(e,f,c,d,C,17,a[14]),d=p(d,e,f,c,D,22,a[15]),c=m(c,d,e,f,w,5,a[16]),f=m(f,c,d,e,t,9,a[17]),e=m(e,f,c,d,z,14,a[18]),d=m(d,e,f,c,h,20,a[19]),c=m(c,d,e,f,s,5,a[20]),f=m(f,c,d,e,y,9,a[21]),e=m(e,f,c,d,D,14,a[22]),d=m(d,e,f,c,r,20,a[23]),c=m(c,d,e,f,x,5,a[24]),f=m(f,c,d,e,C,9,a[25]),e=m(e,f,c,d,q,14,a[26]),d=m(d,e,f,c,v,20,a[27]),c=m(c,d,e,f,B,5,a[28]),f=m(f,c,
	d,e,j,9,a[29]),e=m(e,f,c,d,u,14,a[30]),d=m(d,e,f,c,A,20,a[31]),c=l(c,d,e,f,s,4,a[32]),f=l(f,c,d,e,v,11,a[33]),e=l(e,f,c,d,z,16,a[34]),d=l(d,e,f,c,C,23,a[35]),c=l(c,d,e,f,w,4,a[36]),f=l(f,c,d,e,r,11,a[37]),e=l(e,f,c,d,u,16,a[38]),d=l(d,e,f,c,y,23,a[39]),c=l(c,d,e,f,B,4,a[40]),f=l(f,c,d,e,h,11,a[41]),e=l(e,f,c,d,q,16,a[42]),d=l(d,e,f,c,t,23,a[43]),c=l(c,d,e,f,x,4,a[44]),f=l(f,c,d,e,A,11,a[45]),e=l(e,f,c,d,D,16,a[46]),d=l(d,e,f,c,j,23,a[47]),c=n(c,d,e,f,h,6,a[48]),f=n(f,c,d,e,u,10,a[49]),e=n(e,f,c,d,
	C,15,a[50]),d=n(d,e,f,c,s,21,a[51]),c=n(c,d,e,f,A,6,a[52]),f=n(f,c,d,e,q,10,a[53]),e=n(e,f,c,d,y,15,a[54]),d=n(d,e,f,c,w,21,a[55]),c=n(c,d,e,f,v,6,a[56]),f=n(f,c,d,e,D,10,a[57]),e=n(e,f,c,d,t,15,a[58]),d=n(d,e,f,c,B,21,a[59]),c=n(c,d,e,f,r,6,a[60]),f=n(f,c,d,e,z,10,a[61]),e=n(e,f,c,d,j,15,a[62]),d=n(d,e,f,c,x,21,a[63]);b[0]=b[0]+c|0;b[1]=b[1]+d|0;b[2]=b[2]+e|0;b[3]=b[3]+f|0},_doFinalize:function(){var a=this._data,k=a.words,b=8*this._nDataBytes,h=8*a.sigBytes;k[h>>>5]|=128<<24-h%32;var l=s.floor(b/
	4294967296);k[(h+64>>>9<<4)+15]=(l<<8|l>>>24)&16711935|(l<<24|l>>>8)&4278255360;k[(h+64>>>9<<4)+14]=(b<<8|b>>>24)&16711935|(b<<24|b>>>8)&4278255360;a.sigBytes=4*(k.length+1);this._process();a=this._hash;k=a.words;for(b=0;4>b;b++)h=k[b],k[b]=(h<<8|h>>>24)&16711935|(h<<24|h>>>8)&4278255360;return a},clone:function(){var a=t.clone.call(this);a._hash=this._hash.clone();return a}});r.MD5=t._createHelper(q);r.HmacMD5=t._createHmacHelper(q)})(Math);
	
	//SHA1
	/*
	CryptoJS v3.1.2
	code.google.com/p/crypto-js
	(c) 2009-2013 by Jeff Mott. All rights reserved.
	code.google.com/p/crypto-js/wiki/License
	*/
	var CryptoJS=CryptoJS||function(e,m){var p={},j=p.lib={},l=function(){},f=j.Base={extend:function(a){l.prototype=this;var c=new l;a&&c.mixIn(a);c.hasOwnProperty("init")||(c.init=function(){c.$super.init.apply(this,arguments)});c.init.prototype=c;c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},
	n=j.WordArray=f.extend({init:function(a,c){a=this.words=a||[];this.sigBytes=c!=m?c:4*a.length},toString:function(a){return(a||h).stringify(this)},concat:function(a){var c=this.words,q=a.words,d=this.sigBytes;a=a.sigBytes;this.clamp();if(d%4)for(var b=0;b<a;b++)c[d+b>>>2]|=(q[b>>>2]>>>24-8*(b%4)&255)<<24-8*((d+b)%4);else if(65535<q.length)for(b=0;b<a;b+=4)c[d+b>>>2]=q[b>>>2];else c.push.apply(c,q);this.sigBytes+=a;return this},clamp:function(){var a=this.words,c=this.sigBytes;a[c>>>2]&=4294967295<<
	32-8*(c%4);a.length=e.ceil(c/4)},clone:function(){var a=f.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var c=[],b=0;b<a;b+=4)c.push(4294967296*e.random()|0);return new n.init(c,a)}}),b=p.enc={},h=b.Hex={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],d=0;d<a;d++){var f=c[d>>>2]>>>24-8*(d%4)&255;b.push((f>>>4).toString(16));b.push((f&15).toString(16))}return b.join("")},parse:function(a){for(var c=a.length,b=[],d=0;d<c;d+=2)b[d>>>3]|=parseInt(a.substr(d,
	2),16)<<24-4*(d%8);return new n.init(b,c/2)}},g=b.Latin1={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],d=0;d<a;d++)b.push(String.fromCharCode(c[d>>>2]>>>24-8*(d%4)&255));return b.join("")},parse:function(a){for(var c=a.length,b=[],d=0;d<c;d++)b[d>>>2]|=(a.charCodeAt(d)&255)<<24-8*(d%4);return new n.init(b,c)}},r=b.Utf8={stringify:function(a){try{return decodeURIComponent(escape(g.stringify(a)))}catch(c){throw Error("Malformed UTF-8 data");}},parse:function(a){return g.parse(unescape(encodeURIComponent(a)))}},
	k=j.BufferedBlockAlgorithm=f.extend({reset:function(){this._data=new n.init;this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=r.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var c=this._data,b=c.words,d=c.sigBytes,f=this.blockSize,h=d/(4*f),h=a?e.ceil(h):e.max((h|0)-this._minBufferSize,0);a=h*f;d=e.min(4*a,d);if(a){for(var g=0;g<a;g+=f)this._doProcessBlock(b,g);g=b.splice(0,a);c.sigBytes-=d}return new n.init(g,d)},clone:function(){var a=f.clone.call(this);
	a._data=this._data.clone();return a},_minBufferSize:0});j.Hasher=k.extend({cfg:f.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){k.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(c,b){return(new a.init(b)).finalize(c)}},_createHmacHelper:function(a){return function(b,f){return(new s.HMAC.init(a,
	f)).finalize(b)}}});var s=p.algo={};return p}(Math);
	(function(){var e=CryptoJS,m=e.lib,p=m.WordArray,j=m.Hasher,l=[],m=e.algo.SHA1=j.extend({_doReset:function(){this._hash=new p.init([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(f,n){for(var b=this._hash.words,h=b[0],g=b[1],e=b[2],k=b[3],j=b[4],a=0;80>a;a++){if(16>a)l[a]=f[n+a]|0;else{var c=l[a-3]^l[a-8]^l[a-14]^l[a-16];l[a]=c<<1|c>>>31}c=(h<<5|h>>>27)+j+l[a];c=20>a?c+((g&e|~g&k)+1518500249):40>a?c+((g^e^k)+1859775393):60>a?c+((g&e|g&k|e&k)-1894007588):c+((g^e^
	k)-899497514);j=k;k=e;e=g<<30|g>>>2;g=h;h=c}b[0]=b[0]+h|0;b[1]=b[1]+g|0;b[2]=b[2]+e|0;b[3]=b[3]+k|0;b[4]=b[4]+j|0},_doFinalize:function(){var f=this._data,e=f.words,b=8*this._nDataBytes,h=8*f.sigBytes;e[h>>>5]|=128<<24-h%32;e[(h+64>>>9<<4)+14]=Math.floor(b/4294967296);e[(h+64>>>9<<4)+15]=b;f.sigBytes=4*e.length;this._process();return this._hash},clone:function(){var e=j.clone.call(this);e._hash=this._hash.clone();return e}});e.SHA1=j._createHelper(m);e.HmacSHA1=j._createHmacHelper(m)})();
	
	Crypto.md5 = function(str){
		return CryptoJS.MD5(str).toString();
	}
	
	Crypto.sha1 = function(str){
		return CryptoJS.SHA1(str).toString();
	}
})();


//Underscore
(function(){var n=this,t=n._,r={},e=Array.prototype,u=Object.prototype,i=Function.prototype,a=e.push,o=e.slice,c=e.concat,l=u.toString,f=u.hasOwnProperty,s=e.forEach,p=e.map,h=e.reduce,v=e.reduceRight,d=e.filter,g=e.every,m=e.some,y=e.indexOf,b=e.lastIndexOf,x=Array.isArray,_=Object.keys,j=i.bind,w=function(n){return n instanceof w?n:this instanceof w?(this._wrapped=n,void 0):new w(n)};"undefined"!=typeof exports?("undefined"!=typeof module&&module.exports&&(exports=module.exports=w),exports._=w):n._=w,w.VERSION="1.4.4";var A=w.each=w.forEach=function(n,t,e){if(null!=n)if(s&&n.forEach===s)n.forEach(t,e);else if(n.length===+n.length){for(var u=0,i=n.length;i>u;u++)if(t.call(e,n[u],u,n)===r)return}else for(var a in n)if(w.has(n,a)&&t.call(e,n[a],a,n)===r)return};w.map=w.collect=function(n,t,r){var e=[];return null==n?e:p&&n.map===p?n.map(t,r):(A(n,function(n,u,i){e[e.length]=t.call(r,n,u,i)}),e)};var O="Reduce of empty array with no initial value";w.reduce=w.foldl=w.inject=function(n,t,r,e){var u=arguments.length>2;if(null==n&&(n=[]),h&&n.reduce===h)return e&&(t=w.bind(t,e)),u?n.reduce(t,r):n.reduce(t);if(A(n,function(n,i,a){u?r=t.call(e,r,n,i,a):(r=n,u=!0)}),!u)throw new TypeError(O);return r},w.reduceRight=w.foldr=function(n,t,r,e){var u=arguments.length>2;if(null==n&&(n=[]),v&&n.reduceRight===v)return e&&(t=w.bind(t,e)),u?n.reduceRight(t,r):n.reduceRight(t);var i=n.length;if(i!==+i){var a=w.keys(n);i=a.length}if(A(n,function(o,c,l){c=a?a[--i]:--i,u?r=t.call(e,r,n[c],c,l):(r=n[c],u=!0)}),!u)throw new TypeError(O);return r},w.find=w.detect=function(n,t,r){var e;return E(n,function(n,u,i){return t.call(r,n,u,i)?(e=n,!0):void 0}),e},w.filter=w.select=function(n,t,r){var e=[];return null==n?e:d&&n.filter===d?n.filter(t,r):(A(n,function(n,u,i){t.call(r,n,u,i)&&(e[e.length]=n)}),e)},w.reject=function(n,t,r){return w.filter(n,function(n,e,u){return!t.call(r,n,e,u)},r)},w.every=w.all=function(n,t,e){t||(t=w.identity);var u=!0;return null==n?u:g&&n.every===g?n.every(t,e):(A(n,function(n,i,a){return(u=u&&t.call(e,n,i,a))?void 0:r}),!!u)};var E=w.some=w.any=function(n,t,e){t||(t=w.identity);var u=!1;return null==n?u:m&&n.some===m?n.some(t,e):(A(n,function(n,i,a){return u||(u=t.call(e,n,i,a))?r:void 0}),!!u)};w.contains=w.include=function(n,t){return null==n?!1:y&&n.indexOf===y?n.indexOf(t)!=-1:E(n,function(n){return n===t})},w.invoke=function(n,t){var r=o.call(arguments,2),e=w.isFunction(t);return w.map(n,function(n){return(e?t:n[t]).apply(n,r)})},w.pluck=function(n,t){return w.map(n,function(n){return n[t]})},w.where=function(n,t,r){return w.isEmpty(t)?r?null:[]:w[r?"find":"filter"](n,function(n){for(var r in t)if(t[r]!==n[r])return!1;return!0})},w.findWhere=function(n,t){return w.where(n,t,!0)},w.max=function(n,t,r){if(!t&&w.isArray(n)&&n[0]===+n[0]&&65535>n.length)return Math.max.apply(Math,n);if(!t&&w.isEmpty(n))return-1/0;var e={computed:-1/0,value:-1/0};return A(n,function(n,u,i){var a=t?t.call(r,n,u,i):n;a>=e.computed&&(e={value:n,computed:a})}),e.value},w.min=function(n,t,r){if(!t&&w.isArray(n)&&n[0]===+n[0]&&65535>n.length)return Math.min.apply(Math,n);if(!t&&w.isEmpty(n))return 1/0;var e={computed:1/0,value:1/0};return A(n,function(n,u,i){var a=t?t.call(r,n,u,i):n;e.computed>a&&(e={value:n,computed:a})}),e.value},w.shuffle=function(n){var t,r=0,e=[];return A(n,function(n){t=w.random(r++),e[r-1]=e[t],e[t]=n}),e};var k=function(n){return w.isFunction(n)?n:function(t){return t[n]}};w.sortBy=function(n,t,r){var e=k(t);return w.pluck(w.map(n,function(n,t,u){return{value:n,index:t,criteria:e.call(r,n,t,u)}}).sort(function(n,t){var r=n.criteria,e=t.criteria;if(r!==e){if(r>e||r===void 0)return 1;if(e>r||e===void 0)return-1}return n.index<t.index?-1:1}),"value")};var F=function(n,t,r,e){var u={},i=k(t||w.identity);return A(n,function(t,a){var o=i.call(r,t,a,n);e(u,o,t)}),u};w.groupBy=function(n,t,r){return F(n,t,r,function(n,t,r){(w.has(n,t)?n[t]:n[t]=[]).push(r)})},w.countBy=function(n,t,r){return F(n,t,r,function(n,t){w.has(n,t)||(n[t]=0),n[t]++})},w.sortedIndex=function(n,t,r,e){r=null==r?w.identity:k(r);for(var u=r.call(e,t),i=0,a=n.length;a>i;){var o=i+a>>>1;u>r.call(e,n[o])?i=o+1:a=o}return i},w.toArray=function(n){return n?w.isArray(n)?o.call(n):n.length===+n.length?w.map(n,w.identity):w.values(n):[]},w.size=function(n){return null==n?0:n.length===+n.length?n.length:w.keys(n).length},w.first=w.head=w.take=function(n,t,r){return null==n?void 0:null==t||r?n[0]:o.call(n,0,t)},w.initial=function(n,t,r){return o.call(n,0,n.length-(null==t||r?1:t))},w.last=function(n,t,r){return null==n?void 0:null==t||r?n[n.length-1]:o.call(n,Math.max(n.length-t,0))},w.rest=w.tail=w.drop=function(n,t,r){return o.call(n,null==t||r?1:t)},w.compact=function(n){return w.filter(n,w.identity)};var R=function(n,t,r){return A(n,function(n){w.isArray(n)?t?a.apply(r,n):R(n,t,r):r.push(n)}),r};w.flatten=function(n,t){return R(n,t,[])},w.without=function(n){return w.difference(n,o.call(arguments,1))},w.uniq=w.unique=function(n,t,r,e){w.isFunction(t)&&(e=r,r=t,t=!1);var u=r?w.map(n,r,e):n,i=[],a=[];return A(u,function(r,e){(t?e&&a[a.length-1]===r:w.contains(a,r))||(a.push(r),i.push(n[e]))}),i},w.union=function(){return w.uniq(c.apply(e,arguments))},w.intersection=function(n){var t=o.call(arguments,1);return w.filter(w.uniq(n),function(n){return w.every(t,function(t){return w.indexOf(t,n)>=0})})},w.difference=function(n){var t=c.apply(e,o.call(arguments,1));return w.filter(n,function(n){return!w.contains(t,n)})},w.zip=function(){for(var n=o.call(arguments),t=w.max(w.pluck(n,"length")),r=Array(t),e=0;t>e;e++)r[e]=w.pluck(n,""+e);return r},w.object=function(n,t){if(null==n)return{};for(var r={},e=0,u=n.length;u>e;e++)t?r[n[e]]=t[e]:r[n[e][0]]=n[e][1];return r},w.indexOf=function(n,t,r){if(null==n)return-1;var e=0,u=n.length;if(r){if("number"!=typeof r)return e=w.sortedIndex(n,t),n[e]===t?e:-1;e=0>r?Math.max(0,u+r):r}if(y&&n.indexOf===y)return n.indexOf(t,r);for(;u>e;e++)if(n[e]===t)return e;return-1},w.lastIndexOf=function(n,t,r){if(null==n)return-1;var e=null!=r;if(b&&n.lastIndexOf===b)return e?n.lastIndexOf(t,r):n.lastIndexOf(t);for(var u=e?r:n.length;u--;)if(n[u]===t)return u;return-1},w.range=function(n,t,r){1>=arguments.length&&(t=n||0,n=0),r=arguments[2]||1;for(var e=Math.max(Math.ceil((t-n)/r),0),u=0,i=Array(e);e>u;)i[u++]=n,n+=r;return i},w.bind=function(n,t){if(n.bind===j&&j)return j.apply(n,o.call(arguments,1));var r=o.call(arguments,2);return function(){return n.apply(t,r.concat(o.call(arguments)))}},w.partial=function(n){var t=o.call(arguments,1);return function(){return n.apply(this,t.concat(o.call(arguments)))}},w.bindAll=function(n){var t=o.call(arguments,1);return 0===t.length&&(t=w.functions(n)),A(t,function(t){n[t]=w.bind(n[t],n)}),n},w.memoize=function(n,t){var r={};return t||(t=w.identity),function(){var e=t.apply(this,arguments);return w.has(r,e)?r[e]:r[e]=n.apply(this,arguments)}},w.delay=function(n,t){var r=o.call(arguments,2);return setTimeout(function(){return n.apply(null,r)},t)},w.defer=function(n){return w.delay.apply(w,[n,1].concat(o.call(arguments,1)))},w.throttle=function(n,t){var r,e,u,i,a=0,o=function(){a=new Date,u=null,i=n.apply(r,e)};return function(){var c=new Date,l=t-(c-a);return r=this,e=arguments,0>=l?(clearTimeout(u),u=null,a=c,i=n.apply(r,e)):u||(u=setTimeout(o,l)),i}},w.debounce=function(n,t,r){var e,u;return function(){var i=this,a=arguments,o=function(){e=null,r||(u=n.apply(i,a))},c=r&&!e;return clearTimeout(e),e=setTimeout(o,t),c&&(u=n.apply(i,a)),u}},w.once=function(n){var t,r=!1;return function(){return r?t:(r=!0,t=n.apply(this,arguments),n=null,t)}},w.wrap=function(n,t){return function(){var r=[n];return a.apply(r,arguments),t.apply(this,r)}},w.compose=function(){var n=arguments;return function(){for(var t=arguments,r=n.length-1;r>=0;r--)t=[n[r].apply(this,t)];return t[0]}},w.after=function(n,t){return 0>=n?t():function(){return 1>--n?t.apply(this,arguments):void 0}},w.keys=_||function(n){if(n!==Object(n))throw new TypeError("Invalid object");var t=[];for(var r in n)w.has(n,r)&&(t[t.length]=r);return t},w.values=function(n){var t=[];for(var r in n)w.has(n,r)&&t.push(n[r]);return t},w.pairs=function(n){var t=[];for(var r in n)w.has(n,r)&&t.push([r,n[r]]);return t},w.invert=function(n){var t={};for(var r in n)w.has(n,r)&&(t[n[r]]=r);return t},w.functions=w.methods=function(n){var t=[];for(var r in n)w.isFunction(n[r])&&t.push(r);return t.sort()},w.extend=function(n){return A(o.call(arguments,1),function(t){if(t)for(var r in t)n[r]=t[r]}),n},w.pick=function(n){var t={},r=c.apply(e,o.call(arguments,1));return A(r,function(r){r in n&&(t[r]=n[r])}),t},w.omit=function(n){var t={},r=c.apply(e,o.call(arguments,1));for(var u in n)w.contains(r,u)||(t[u]=n[u]);return t},w.defaults=function(n){return A(o.call(arguments,1),function(t){if(t)for(var r in t)null==n[r]&&(n[r]=t[r])}),n},w.clone=function(n){return w.isObject(n)?w.isArray(n)?n.slice():w.extend({},n):n},w.tap=function(n,t){return t(n),n};var I=function(n,t,r,e){if(n===t)return 0!==n||1/n==1/t;if(null==n||null==t)return n===t;n instanceof w&&(n=n._wrapped),t instanceof w&&(t=t._wrapped);var u=l.call(n);if(u!=l.call(t))return!1;switch(u){case"[object String]":return n==t+"";case"[object Number]":return n!=+n?t!=+t:0==n?1/n==1/t:n==+t;case"[object Date]":case"[object Boolean]":return+n==+t;case"[object RegExp]":return n.source==t.source&&n.global==t.global&&n.multiline==t.multiline&&n.ignoreCase==t.ignoreCase}if("object"!=typeof n||"object"!=typeof t)return!1;for(var i=r.length;i--;)if(r[i]==n)return e[i]==t;r.push(n),e.push(t);var a=0,o=!0;if("[object Array]"==u){if(a=n.length,o=a==t.length)for(;a--&&(o=I(n[a],t[a],r,e)););}else{var c=n.constructor,f=t.constructor;if(c!==f&&!(w.isFunction(c)&&c instanceof c&&w.isFunction(f)&&f instanceof f))return!1;for(var s in n)if(w.has(n,s)&&(a++,!(o=w.has(t,s)&&I(n[s],t[s],r,e))))break;if(o){for(s in t)if(w.has(t,s)&&!a--)break;o=!a}}return r.pop(),e.pop(),o};w.isEqual=function(n,t){return I(n,t,[],[])},w.isEmpty=function(n){if(null==n)return!0;if(w.isArray(n)||w.isString(n))return 0===n.length;for(var t in n)if(w.has(n,t))return!1;return!0},w.isElement=function(n){return!(!n||1!==n.nodeType)},w.isArray=x||function(n){return"[object Array]"==l.call(n)},w.isObject=function(n){return n===Object(n)},A(["Arguments","Function","String","Number","Date","RegExp"],function(n){w["is"+n]=function(t){return l.call(t)=="[object "+n+"]"}}),w.isArguments(arguments)||(w.isArguments=function(n){return!(!n||!w.has(n,"callee"))}),"function"!=typeof/./&&(w.isFunction=function(n){return"function"==typeof n}),w.isFinite=function(n){return isFinite(n)&&!isNaN(parseFloat(n))},w.isNaN=function(n){return w.isNumber(n)&&n!=+n},w.isBoolean=function(n){return n===!0||n===!1||"[object Boolean]"==l.call(n)},w.isNull=function(n){return null===n},w.isUndefined=function(n){return n===void 0},w.has=function(n,t){return f.call(n,t)},w.noConflict=function(){return n._=t,this},w.identity=function(n){return n},w.times=function(n,t,r){for(var e=Array(n),u=0;n>u;u++)e[u]=t.call(r,u);return e},w.random=function(n,t){return null==t&&(t=n,n=0),n+Math.floor(Math.random()*(t-n+1))};var M={escape:{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","/":"&#x2F;"}};M.unescape=w.invert(M.escape);var S={escape:RegExp("["+w.keys(M.escape).join("")+"]","g"),unescape:RegExp("("+w.keys(M.unescape).join("|")+")","g")};w.each(["escape","unescape"],function(n){w[n]=function(t){return null==t?"":(""+t).replace(S[n],function(t){return M[n][t]})}}),w.result=function(n,t){if(null==n)return null;var r=n[t];return w.isFunction(r)?r.call(n):r},w.mixin=function(n){A(w.functions(n),function(t){var r=w[t]=n[t];w.prototype[t]=function(){var n=[this._wrapped];return a.apply(n,arguments),D.call(this,r.apply(w,n))}})};var N=0;w.uniqueId=function(n){var t=++N+"";return n?n+t:t},w.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};var T=/(.)^/,q={"'":"'","\\":"\\","\r":"r","\n":"n","	":"t","\u2028":"u2028","\u2029":"u2029"},B=/\\|'|\r|\n|\t|\u2028|\u2029/g;w.template=function(n,t,r){var e;r=w.defaults({},r,w.templateSettings);var u=RegExp([(r.escape||T).source,(r.interpolate||T).source,(r.evaluate||T).source].join("|")+"|$","g"),i=0,a="__p+='";n.replace(u,function(t,r,e,u,o){return a+=n.slice(i,o).replace(B,function(n){return"\\"+q[n]}),r&&(a+="'+\n((__t=("+r+"))==null?'':_.escape(__t))+\n'"),e&&(a+="'+\n((__t=("+e+"))==null?'':__t)+\n'"),u&&(a+="';\n"+u+"\n__p+='"),i=o+t.length,t}),a+="';\n",r.variable||(a="with(obj||{}){\n"+a+"}\n"),a="var __t,__p='',__j=Array.prototype.join,"+"print=function(){__p+=__j.call(arguments,'');};\n"+a+"return __p;\n";try{e=Function(r.variable||"obj","_",a)}catch(o){throw o.source=a,o}if(t)return e(t,w);var c=function(n){return e.call(this,n,w)};return c.source="function("+(r.variable||"obj")+"){\n"+a+"}",c},w.chain=function(n){return w(n).chain()};var D=function(n){return this._chain?w(n).chain():n};w.mixin(w),A(["pop","push","reverse","shift","sort","splice","unshift"],function(n){var t=e[n];w.prototype[n]=function(){var r=this._wrapped;return t.apply(r,arguments),"shift"!=n&&"splice"!=n||0!==r.length||delete r[0],D.call(this,r)}}),A(["concat","join","slice"],function(n){var t=e[n];w.prototype[n]=function(){return D.call(this,t.apply(this._wrapped,arguments))}}),w.extend(w.prototype,{chain:function(){return this._chain=!0,this},value:function(){return this._wrapped}})}).call(this);


//