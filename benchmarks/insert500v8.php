<?php

require '../Client-Libraries/PHP/predis-0.8.3/Autoloader.php';
Predis\Autoloader::register();

$redis = new Predis\Client('unix:///tmp/redis.sock');

function makeComment($postid){
	global $redis;
	$redis->jscall('benchmarkInsertComment',$postid,'comment sample title','comment sample body','h0x91B');
}

function makePost(){
	global $redis;
	$ret = $redis->jscall('benchmarkInsertPost','post sample title','post sample body','h0x91B');
	for($i=0;$i<100;$i++)
		makeComment($ret['ret']);
}

$start = microtime(TRUE);
for($i=0;$i<500;$i++)
	makepost();
echo "Speed: ".(round(252000/(microtime(TRUE)-$start)))." ops/sec\n";
//total commands 252000
?>
