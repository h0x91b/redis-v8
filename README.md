redis-v8
========

Experiment, Redis (2.9.9) with built in google v8 JS engine

Currently tested only on OSX

Speed
=====

On my machine v8 works 2.75 ~ 6.7 times faster than redis-benchmark on socket:

PING: 
	
	V8: 487000
	
	redis-benchmark: 75187

INCR:
	
	V8: 307800
	
	redis-benchmark: 72992

GET:
	
	V8: 251800
	
	redis-benchmark: 74626

SET:
	
	V8: 190100
	
	redis-benchmark: 69400

Using
=====
	Run server
		./redis-server ../redis.conf

	./redis-cli JS "redis.hmset('HSET:TEST',{title:'hello', body: 'world'}); return redis.hgetall('HSET:TEST')"

	time ./redis-cli JS "for(var i=0; i< 1000000; i++) redis.set('KV:TEST'+i,'hello world '+i);"

	./redis-cli
		JS "console.log('hello world!',{a:123,b:{c:[]}})"
	in redis.log you will see:
		[60565] 01 May 13:37:11.184 * console.log argument[0] = hello world!
		[60565] 01 May 13:37:11.186 * console.log argument[1] = {
			"a": 123,
			"b": {
				"c": []
			}
		}


Compiling
=========

Get redis-v8 source

	git clone git://github.com/h0x91b/redis-v8.git

You will also need a v8 =)

	cd redis-v8/redis/deps/
	git clone git@github.com:v8/v8.git
	cd v8/
	make dependencies

Now you can make a redis

	cd ../../
	make

Start server

	cd src/; ./redis-server ../redis.conf
