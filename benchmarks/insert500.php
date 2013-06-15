<?php

require '../Client-Libraries/PHP/predis-0.8.3/Autoloader.php';
Predis\Autoloader::register();

$redis = new Predis\Client('unix:///tmp/redis.sock');

function makeComment($postid){
	global $redis;
	$id = $redis->incr('INCR:POST:'.$postid.':COMMENT_ID');
	$redis->incr('KV:AUTHOR:h0x91B:comments');
	$redis->incr('INCR:POST:'.$id.':COMMENTS');
	$hmset = array(
		'id'=>$id,
		'postid'=>$postid,
		'title'=>'comment sample title',
		'body'=>'comment sample body',
		'author'=>'h0x91B',
		'time'=>time()
	);
	$redis->hmset('HSET:POST:'.$postid.':COMMENT:'.$id,$hmset);
	$redis->zadd('ZSET:COMMENTS:POST:'.$postid,time(),$id);
}

function makePost(){
	global $redis;
	$id = $redis->incr('INCR:POST_ID');
	$redis->incr('KV:AUTHOR:h0x91B:posts');
	$hmset = array(
		'id'=>$id,
		'title'=>'post sample title',
		'body'=>'post sample body',
		'author'=>'h0x91B',
		'time'=>time()
	);
	$redis->hmset('HSET:POST:'.$id,$hmset);
	$redis->zadd('ZSET:POSTS',time(),$id);
	for($i=0;$i<100;$i++)
		makeComment($id);
}

$start = microtime(TRUE);
for($i=0;$i<500;$i++)
	makepost();
echo "Speed: ".(round(252000/(microtime(TRUE)-$start)))." ops/sec\n";
//total commands 252000
?>
