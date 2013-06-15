<?php
date_default_timezone_set('Europe/Moscow');
require '../Client-Libraries/PHP/predis-0.8.3/Autoloader.php';
Predis\Autoloader::register();

$redis = new Predis\Client('unix:///tmp/redis.sock');

$start = microtime(TRUE);
$posts = $redis->zrevrange('ZSET:POSTS',0,1499);
foreach($posts as $postid){
	$redis->jscall('benchmarkGetPost',$postid);
}
echo "Speed: ".(round(157501/(microtime(TRUE)-$start)))." ops/sec\n";
//total commands 157501
?>
