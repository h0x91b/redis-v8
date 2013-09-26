redis-v8 alpha
==============

Redis (2.9.11) with built in google V8 JS engine (3.22.2)

Currently tested on Mac OS X and CentOS 6.3

Fast JS database scripts
========================

Place into ./js directory (js-dir flag in redis.conf) any js file.

./js/example.js

	function MakeMillionKeys(){
		for(var i=0;i<1000000;i++){
			redis.set('KEY'+i,'some value');
		}
	}

	function getRandom100keys(){
		var ret = Array(100);
		for(var i=0;i<100;i++){
			var key = 'KEY'+Math.floor(Math.random()*1000000);
			var value = redis.get(key);
			ret[i] = {
				key: key,
				value: value
			}
		}
		return ret;
	}
	
Open console or any standard redis client and type:

	$ ./redis-cli JSRELOAD #this will reload a V8 and all JS DB scripts
	$ ./redis-cli JS "MakeMillionKeys();"
	"{\"ret\":null,\"cmds\":1000000}"
	$ ./redis-cli JS "return getRandom100keys()"
	"{\"ret\":[{\"key\":\"KEY258647\",\"value\":\"some value\"},...99 more keys here...],\"cmds\":100}"

Speed
=====

Tested on virtual host with CentOS 6.3 64bit, 1 cpu core 2.4 GHz and 1GB ram:

	$ ./redis-benchmark -q -s /tmp/redis.sock 
	
	PING_INLINE: 71428.57 requests per second
	PING_BULK: 66225.17 requests per second
	V8 PING: 22883.29 requests per second
	SET: 81967.21 requests per second
	V8 SET JSCALL 1 inline (Worst case): 22271.71 requests per second
	V8 SET JSCALL 100 inline (result * 100): 625782.25 requests per second
	V8 SET JSCALL 300 inline (result * 300): 827814.56 requests per second
	GET: 75187.97 requests per second
	V8 GET JSCALL 1 inline (Worst case): 22321.43 requests per second
	V8 GET JSCALL 100 inline (result * 100): 833333.31 requests per second
	V8 GET JSCALL 300 inline (result * 300): 1206757.88 requests per second
	INCR: 80645.16 requests per second
	V8 INCR JSCALL 1 inline (Worst case): 21459.23 requests per second
	V8 INCR JSCALL 100 inline (result * 100): 713775.88 requests per second
	V8 INCR JSCALL 300 inline (result * 300): 875401.25 requests per second
	LPUSH: 73529.41 requests per second
	LPOP: 66666.66 requests per second
	SADD: 66225.17 requests per second
	SPOP: 60240.96 requests per second
	LPUSH (needed to benchmark LRANGE): 69930.07 requests per second
	LRANGE_100 (first 100 elements): 20080.32 requests per second
	LRANGE_300 (first 300 elements): 9569.38 requests per second
	LRANGE_500 (first 450 elements): 7267.44 requests per second
	LRANGE_600 (first 600 elements): 6082.73 requests per second
	MSET (10 keys): 35211.27 requests per second


Using
=====

Run server

	./redis-server ../redis.conf

Some commands for example

	$ ./redis-cli JS "redis.hmset('HSET:TEST',{title:'hello', body: 'world'}); return redis.hgetall('HSET:TEST')"
	"{\"ret\":{\"title\":\"hello\",\"body\":\"world\"},\"cmds\":2}"
	
	$ time ./redis-cli JS "for(var i=0; i<1000000; i++) redis.set('KV:TEST'+i,'hello world '+i); return redis.get('KV:TEST50000')"
	"{\"ret\":\"hello world 50000\",\"cmds\":1000001}"

	real	0m2.244s
	user	0m0.002s
	sys	0m0.003s

Using console, run redis-cli
	
	./redis-cli

And type

	JS "return Math.round(Math.random()*100)"
	JS "redis.set('hello', 'world')"
	JS "return redis.get('hello')"

Debugging

	JS "console.log('hello world!',{a:123,b:{c:[]}})"
	JS "console.log(redis.get('hello'))"
	
In redis.log you will see:

	[60565] 01 May 13:37:11.184 * console.log argument[0] = hello world!
	[60565] 01 May 13:37:11.186 * console.log argument[1] = {
		"a": 123,
		"b": {
			"c": []
		}
	}


Compiling
=========

For compiling redis-v8 you will need folowing packages:
	
	make
	clang++
	git
	svn
	vim-common
	jemalloc-devel
	tclsh8.5

Get redis-v8 source

	git clone git://github.com/h0x91b/redis-v8.git
	cd redis-v8/redis
	make MALLOC=jemalloc

Start server

	cd src/
	./redis-server ../redis.conf

Run v8 tests only:

	cd redis-v8/redis
	tclsh8.5 tests/test_helper.tcl --single v8/v8


LICENSE
=======
Copyright (c) 2013 Arseniy Pavlenko <h0x91b@gmail.com>

Copyright (c) 2006-2012, Salvatore Sanfilippo
All rights reserved.

Copyright 2006-2012, the V8 project authors. All rights reserved.

The MIT License (MIT)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
