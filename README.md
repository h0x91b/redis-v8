redis_v8
========

experiment

Currently tested only on OSX


Compiling
=========

You will need v8 =)

<code>cd redis/deps/</code>

<code>git clone git@github.com:v8/v8.git</code>

<code>make dependencies</code>

Now you can make a redis

<code>cd redis/</code>

<code>make</code>

Start server

<code>cd src/; ./redis-server ../redis.conf</code>

Using
=====

<code> ./redis-cli JS "redis.hmset('HSET:TEST',{title:'hello', body: 'world'}); return redis.hgetall('HSET:TEST')" </code>


<code> time ./redis-cli JS "for(var i=0; i< 1000000; i++) redis.set('KV:TEST'+i,'hello world '+i);" </code>

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
