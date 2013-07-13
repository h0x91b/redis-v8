start_server {tags {"basic"}} {
	test {V8 test db is empty} {
		r flushall
		r dbsize
	} {0}
	
	test {V8 simple Math js} {
		r js {return Math.floor(10/3)}
	} {{"ret":3,"cmds":0}}
	
	test {V8 get non exists key} {
		r js {return redis.get('non exists key')}
	} {{"ret":null,"cmds":1}}
	
	test {V8 set and get key} {
		r js {redis.set('exist key','exist value'); return redis.get('exist key')}
	} {{"ret":"exist value","cmds":2}}
	
	test {V8 hmset & hgetall} {
		r js {redis.hmset('HSET',{a:123,b:"string"}); return redis.hgetall('HSET')}
	} {{"ret":{"a":"123","b":"string"},"cmds":2}}
	
	test {V8 hmget} {
		r js {return redis.hmget('HSET','a','b');}
	} {{"ret":{"a":"123","b":"string"},"cmds":1}}
	
	test {V8 hmget array} {
		r js {return redis.hmget('HSET',['a','b']);}
	} {{"ret":{"a":"123","b":"string"},"cmds":1}}

	test {V8 dump key (test must fail)} {
		r js {return redis.dump('HSET');}
	} {cant handle binary data}

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
		r config set js-timeout 3
		r config get js-timeout
	} {js-timeout 3}
	
	test {V8 script timeout test} {
		assert_error {ERR -Script runs too long, Exception error: "null"} {r js {while(1){}}}
	}
	
	test {V8 exists command returns 0} {
		r js {return redis.exists('non exist');}
	} {{"ret":0,"cmds":1}}
	
	test {V8 exists command returns 1} {
		r js {redis.set('key','value'); return redis.exists('key');}
	} {{"ret":1,"cmds":2}}
	
	test {V8 js config_get} {
		r js {return redis.config_get('js-dir')}
	} {{"ret":["js-dir","./js/"],"cmds":1}}
	
	test {V8 JSCALL test} {
		r jscall redis.get key
	} {{"ret":"value","cmds":1}}
	
	test {V8 JSCALL incr not exists key} {
		r jscall redis.del incrkey
		r jscall redis.incr incrkey
	} {{"ret":1,"cmds":1}}
	
	test {V8 JSCALL incr exist key} {
		r jscall redis.set incrkey1 100
		r jscall redis.incr incrkey1
	} {{"ret":101,"cmds":1}}
	
	test {V8 JSCALL incrby 100} {
		r jscall redis.set incrkey2 1000
		r jscall redis.incrby incrkey2 100
	} {{"ret":1100,"cmds":1}}
	
	test {V8 JSCALL incrby JS overflow check} {
		r jscall redis.set incrkey3 9007199254740992
		r jscall redis.incrby incrkey3 1
	} {{"ret":"9007199254740993","cmds":1}}
	
	test {V8 JSCALL incrby overflow check} {
		r jscall redis.set incrkey4 {9223372036854775806}
		assert_error {ERR -increment or decrement would overflow} {r jscall redis.incrby incrkey4 10}
	}
	
	test {V8 JSCALL incrby value not integer} {
		r jscall redis.del incrkey5
		r jscall redis.hset incrkey5 field value
		assert_error {ERR -value is not integer} {r jscall redis.incrby incrkey5 10}
	}
	
	test {V8 JSCALL incrby without arg return same value} {
		r jscall redis.del incrkey6
		r jscall redis.set incrkey6 99
		r jscall redis.incrby incrkey6
	} {{"ret":99,"cmds":1}}
	
	test {V8 JSCALL incrby on non existing key without arg return 0} {
		r jscall redis.del incrkey7
		r jscall redis.incrby incrkey7
	} {{"ret":0,"cmds":1}}
	
	test {V8 JSCALL incrby (incr value not integer)} {
		r jscall redis.del incrkey8
		r jscall redis.set incrkey8 3
		r jscall redis.incrby incrkey8 hello
	} {{"ret":3,"cmds":1}}
	
	test {V8 JSCALL incrby without args} {
		assert_error {ERR -Not specified key} {r jscall redis.incrby}
	}
}
