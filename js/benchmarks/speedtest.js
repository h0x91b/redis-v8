function benchmarkInsertPost(title, body, author){
	var id = redis.incr('INCR:POST_ID');
	redis.incr('KV:AUTHOR:h0x91B:posts');
	var time = Math.round((+new Date)/1000);
	var hmset = {
		id: id,
		title: title,
		body: body,
		author: author,
		time: time
	};
	redis.hmset('HSET:POST:'+id,hmset);
	redis.zadd('ZSET:POSTS',time,id);
	return id;
}

function benchmarkInsertComment(postid,title,body,author){
	var id = redis.incr('INCR:POST:'+postid+':COMMENT_ID');
	redis.incr('KV:AUTHOR:h0x91B:comments');
	redis.incr('INCR:POST:'+postid+':COMMENTS');
	var time = Math.round((+new Date)/1000);
	var hmset = {
		id: id,
		postid: postid,
		title: title,
		body: body,
		author: author,
		time: time
	};
	redis.hmset('HSET:POST:'+postid+':COMMENT:'+id,hmset);
	redis.zadd('ZSET:COMMENTS:POST:'+postid, time,id);
	return id;
}

function benchmarkGetPost(id){
	var post = redis.hgetall('HSET:POST:'+id);
	post['total_views'] = redis.incr('INCR:POST:'+id+':TOTAL_VIEWS');
	var date = new Date();
	var string_date = date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
	post['dayly_views'] = redis.incr('INCR:POST:'+id+':DAYLY_VIEWS:'
										+string_date
									);
	post['hourly_views'] = redis.incr('INCR:POST:'+id+':HOURLY_VIEWS:'
										+string_date+'_'+date.getHours()
									);
	var comments = redis.zrevrange('ZSET:COMMENTS:POST:'+id,0,99);
	post['comments'] = comments.map(function(comment){
		return redis.hgetall('HSET:POST:'+id+':COMMENT:'+comment);
	})
	return post;
}