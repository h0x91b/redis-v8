<?php

require '../Client-Libraries/PHP/predis-0.8.3/Autoloader.php';
Predis\Autoloader::register();

$redis = new Predis\Client('unix:///tmp/redis.sock');

function makeComment($postid,$pipe){
	global $redis;
	$id = $redis->incr('INCR:POST:'.$postid.':COMMENT_ID');
	$pipe->incr('KV:AUTHOR:h0x91B:comments');
	$pipe->incr('INCR:POST:'.$id.':COMMENTS');
	$hmset = array(
		'id'=>$id,
		'postid'=>$postid,
		'title'=>'comment sample title',
		'body'=>'comment sample body',
		'author'=>'h0x91B',
		'time'=>time()
	);
	$pipe->hmset('HSET:POST:'.$postid.':COMMENT:'.$id,$hmset);
	$pipe->zadd('ZSET:COMMENTS:POST:'.$postid,time(),$id);
}

function makePost($pipe){
	global $redis;
	$id = $redis->incr('INCR:POST_ID');
	$pipe->incr('KV:AUTHOR:h0x91B:posts');
	$hmset = array(
		'id'=>$id,
		'title'=>'post sample title',
		'body'=>'post sample body',
		'author'=>'h0x91B',
		'time'=>time()
	);
	$pipe->hmset('HSET:POST:'.$id,$hmset);
	$pipe->zadd('ZSET:POSTS',time(),$id);
	for($i=0;$i<100;$i++)
		makeComment($id,$pipe);
}

$start = microtime(TRUE);
$replies = $redis->pipeline(function ($pipe) {
	for($i=0;$i<500;$i++)
		makepost($pipe);
});
echo "Speed: ".(round(252000/(microtime(TRUE)-$start)))." ops/sec\n";
//total commands 252000
?>