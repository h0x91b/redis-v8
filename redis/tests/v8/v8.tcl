start_server {tags {"basic"}} {
    test {DEL all keys to start with a clean DB} {
        foreach key [r keys *] {r del $key}
        r dbsize
    } {0}

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

    test {V8 dump key} {
        r js {return redis.dump('HSET');}
    } {cant handle binary data, not implemented yet}
}
