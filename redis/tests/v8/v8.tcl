start_server {tags {"basic"}} {
	test {V8 test db is empty} {
		r flushall
		r dbsize
	} {0}
	
	test {V8 simple Math js} {
		r js {return Math.floor(10/3)}
	} {{"ret":3}}
	
	test {V8 get non exists key} {
		r js {return redis.get('non exists key')}
	} {{"ret":null}}
	
	test {V8 set and get key} {
		r js {redis.set('exist key','exist value'); return redis.get('exist key')}
	} {{"ret":"exist value"}}
	
	test {V8 hmset & hgetall} {
		r js {redis.hmset('HSET',{a:123,b:"string"}); return redis.hgetall('HSET')}
	} {{"ret":{"a":"123","b":"string"}}}
	
	test {V8 hmget} {
		r js {return redis.hmget('HSET','a','b');}
	} {{"ret":{"a":"123","b":"string"}}}
	
	test {V8 hmget array} {
		r js {return redis.hmget('HSET',['a','b']);}
	} {{"ret":{"a":"123","b":"string"}}}

	test {V8 dump key (test must fail)} {
		r js {return redis.dump('HSET');}
	} {cant handle binary data}

	test {V8 test user script blogpost.new} {
		r js {blogpost.new('test title','test body'); return redis.hmget('HSET:BLOG_POST:1','id','title','body');}
	} {{"ret":{"id":"1","title":"test title","body":"test body"}}}

	test {V8 exception test} {
		assert_error {ERR -Exception error: "error"} {r js {throw "error"}}
	}
	
	test {V8 syntax error test} {
		assert_error {ERR -Compile error: "SyntaxError: Unexpected identifier"} {r js {int a}}
	}
	
	test {V8 SET CONFIG js-dir} {
		r config set js-dir ./js/
		r config get js-dir
	} {js-dir ./js/}
	
	test {V8 SET CONFIG js-slow} {
		r config set js-slow 100
		r config get js-slow
	} {js-slow 100}
	
	test {V8 SET CONFIG js-timeout} {
		r config set js-timeout 1
		r config get js-timeout
	} {js-timeout 1}
	
	test {V8 script timeout test} {
		assert_error {ERR -Script runs too long, Exception error: "null"} {r js {while(1){}}}
	}
}
