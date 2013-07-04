<?php
date_default_timezone_set('Europe/Moscow');
require '../../Client-Libraries/PHP/predis-0.8.3/Autoloader.php';
Predis\Autoloader::register();

$redis = new Predis\Client('unix:///tmp/redis.sock');

$redis->set('bench_key','1');

$sha1 = $redis->script("LOAD","local a = 0 for i=1, 300 do a = redis.call('INCR','bench_key') end return a");

$start = microtime(TRUE);
for($i=0;$i<100000/300;$i++){
	$redis->evalsha($sha1,0);
}
echo "Speed: ".(round(100000/(microtime(TRUE)-$start)))." ops/sec\n";
$redis->del('bench_key');
?>
