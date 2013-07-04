<?php
date_default_timezone_set('Europe/Moscow');
require '../../Client-Libraries/PHP/predis-0.8.3/Autoloader.php';
Predis\Autoloader::register();

$redis = new Predis\Client('unix:///tmp/redis.sock');

$start = microtime(TRUE);
for($i=0;$i<100000/10;$i++){
	$pipe = $redis->pipeline();
	for($n=0;$n<10;$n++)
		$pipe->set('bench_key','value');
	$pipe->execute();
}
echo "Speed: ".(round(100000/(microtime(TRUE)-$start)))." ops/sec\n";
$redis->del('bench_key');
?>
