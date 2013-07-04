<?php

require 'predis-0.8.3/Autoloader.php';
Predis\Autoloader::register();

$redis_profile = Predis\Profile\ServerProfile::get('2.6');

//connect (by default 127.0.0.1:6379)
$redis = new Predis\Client(array(
		'host'     => '127.0.0.1',
		'port'     => 6379,
		'profile'  => $redis_profile
	)
);

//js command will execute JS script in redis
//return will be JSON encoded, predis will reencode in normal JS array
var_dump( 
	$redis->js("return 2+2*2;") 
);

//In JS we have a redis object, on this object we can call any redis command, like set, get, incr etc...
//So let`s make a "hello" key, with "world" value, and get it back to PHP
var_dump( 
	$redis->js(
		'redis.set("hello","world"); return redis.get("hello");'
	) 
);

?>
