<?php
date_default_timezone_set('Europe/Moscow');
require '../../Client-Libraries/PHP/predis-0.8.3/Autoloader.php';
Predis\Autoloader::register();

$redis = new Predis\Client('unix:///tmp/redis.sock');

$redis->set('bench_key','value');
$start = microtime(TRUE);
for($i=0;$i<1000000/10;$i++){
	$redis->js('var ret = []; for(var i=0;i<10;i++) ret.push(redis.get("bench_key")); return ret;');
}
echo "Speed: ".(round(1000000/(microtime(TRUE)-$start)))." ops/sec\n";
$redis->del('bench_key');
//total commands 157501
?>
