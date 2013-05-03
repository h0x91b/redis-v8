redis-v8 alpha
========

Redis (2.9.9) with built in google V8 JS engine

Currently tested on Mac OS X and CentOS 6.3

Speed
=====

Tested on virtual host with CentOS 6.3 64bit, 1 cpu core 2.4 GHz and 1GB ram:

	$ ./redis-benchmark -q -s /tmp/redis.sock 
	
	PING_INLINE: 72992.70 requests per second
	PING_BULK: 73529.41 requests per second
	V8 PING_BULK: 27247.96 requests per second
	V8 PING_BULK 100 inline (result * 100): 778816.19 requests per second
	V8 PING_BULK 300 inline (result * 300): 970245.75 requests per second
	SET: 84745.77 requests per second
	V8 SET 1 inline: 24875.62 requests per second
	V8 SET 10 inline (result * 10): 169779.30 requests per second
	V8 SET 100 inline (result * 100): 424989.41 requests per second
	V8 SET 300 inline (result * 300): 485122.88 requests per second
	V8 OPTIMIZED SET 1 inline: 26881.72 requests per second
	V8 OPTIMIZED SET 10 inline (result * 10): 207468.89 requests per second
	V8 OPTIMIZED SET 100 inline (result * 100): 648508.38 requests per second
	V8 OPTIMIZED SET 300 inline (result * 300): 839630.56 requests per second
	GET: 81967.21 requests per second
	V8 GET 1 inline: 25706.94 requests per second
	V8 GET 10 inline (result * 10): 171526.58 requests per second
	V8 GET 100 inline (result * 100): 451060.00 requests per second
	V8 GET 300 inline (result * 300): 567644.25 requests per second
	V8 OPTIMIZED GET 1 inline: 27855.15 requests per second
	V8 OPTIMIZED GET 10 inline (result * 10): 242718.44 requests per second
	V8 OPTIMIZED GET 100 inline (result * 100): 1064962.75 requests per second
	V8 OPTIMIZED GET 300 inline (result * 300): 1434720.12 requests per second
	INCR: 86206.90 requests per second
	V8 INCR: 25706.94 requests per second
	V8 INCR 100 inline (result * 100): 458715.56 requests per second
	V8 INCR 300 inline (result * 300): 529848.06 requests per second
	LPUSH: 88495.58 requests per second
	V8 LPUSH 1 inline: 25510.21 requests per second
	V8 LPUSH 100 inline (result * 100): 381533.75 requests per second
	V8 LPUSH 300 inline (result * 300): 445368.16 requests per second
	LPOP: 85470.09 requests per second
	SADD: 78740.16 requests per second
	SPOP: 75187.97 requests per second
	LPUSH (needed to benchmark LRANGE): 80645.16 requests per second
	LRANGE_100 (first 100 elements): 23696.68 requests per second
	LRANGE_300 (first 300 elements): 11173.18 requests per second
	LRANGE_500 (first 450 elements): 8230.45 requests per second
	LRANGE_600 (first 600 elements): 6464.12 requests per second
	MSET (10 keys): 37037.04 requests per second


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

Get redis-v8 source

	git clone git://github.com/h0x91b/redis-v8.git
	cd redis-v8/redis
	make MALLOC=jemalloc

Start server

	cd src/
	./redis-server ../redis.conf
