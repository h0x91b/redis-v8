<?php
date_default_timezone_set('Europe/Moscow');
require '../../Client-Libraries/PHP/predis-0.8.3/Autoloader.php';
Predis\Autoloader::register();

$redis = new Predis\Client('unix:///tmp/redis.sock');

$sha1 = $redis->script("LOAD","local a = {} for i=1, 500 do a[i] = redis.call('SET','bench_key', 'value') end");

$start = microtime(TRUE);
for($i=0;$i<100000/500;$i++){
	$redis->evalsha($sha1,0);
}
echo "Speed: ".(round(100000/(microtime(TRUE)-$start)))." ops/sec\n";
$redis->del('bench_key');
?>
