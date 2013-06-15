<?php
date_default_timezone_set('Europe/Moscow');
require '../Client-Libraries/PHP/predis-0.8.3/Autoloader.php';
Predis\Autoloader::register();

$redis = new Predis\Client('unix:///tmp/redis.sock');

function getPost($id){
	global $redis;
	$post = $redis->hgetall('HSET:POST:'.$id);
	$post['total_views'] = $redis->incr('INCR:POST:'.$id.':TOTAL_VIEWS');
	$post['dayly_views'] = $redis->incr('INCR:POST:'.$id.':DAYLY_VIEWS:'.date('Y-m-d'));
	$post['hourly_views'] = $redis->incr('INCR:POST:'.$id.':HOURLY_VIEWS:'.date('Y-m-d_H'));
	$pipe = $redis->pipeline();
	$comments = $redis->zrevrange('ZSET:COMMENTS:POST:'.$id,0,99);
	foreach($comments as $comment){
		$pipe->hgetall('HSET:POST:'.$id.':COMMENT:'.$comment);
	}
	$post['comments'] = $pipe->execute();
	return $post;
}

$start = microtime(TRUE);
$posts = $redis->zrevrange('ZSET:POSTS',0,1499);
foreach($posts as $postid){
	getPost($postid);
}
echo "Speed: ".(round(157501/(microtime(TRUE)-$start)))." ops/sec\n";
//total commands 157501
?>
