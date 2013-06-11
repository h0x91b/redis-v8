<?php

require 'predis-0.8.3/Autoloader.php';
Predis\Autoloader::register();

//connect (by default 127.0.0.1:6379)
$redis = new Predis\Client();

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
