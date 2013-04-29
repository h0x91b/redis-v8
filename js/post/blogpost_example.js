console.log('add_new_post file');

blogpost = {
	new: function(title,body){
		var id = redis.incr('KV:BLOG_POST_ID');
		var post = {
			id: id,
			title: title,
			body: body,
			date: +new Date
		}
		redis.hmset('HSET:BLOG_POST:'+id,post);
		redis.zadd('ZSET:BLOG_POSTS',post.date,id);
		return post;
	},
	comment: function(post_id,title,body){
		if(!redis.exists('HSET:BLOG_POST:'+post_id)) return null;
		var id = redis.incr('KV:BLOG_POST_COMMENT_ID');
		var comment = {
			id: id,
			post: post_id,
			title: title,
			body: body,
			date: +new Date
		};
		redis.zadd('ZSET:BLOG_POST:'+post_id+':COMMENTS',comment.date,id);
		redis.hmset('HSET:BLOG_POST_COMMENT:'+id,comment);
		return comment;
	},
	del: function(id){
		var comments = redis.zrange('ZSET:BLOG_POST:'+id+':COMMENTS',0,-1);
		for(var i=0;i<comments.length;i++){
			redis.del('HSET:BLOG_POST_COMMENT:'+comments[i]);
		}
		redis.del('ZSET:BLOG_POST:'+id+':COMMENTS');
		redis.del('HSET:BLOG_POST:'+id);
		redis.zrem('ZSET:BLOG_POSTS',id);
	},
	get: function(id){
		var post = redis.hgetall('HSET:BLOG_POST:'+id);
		if(!post) return null;
		post.comments = [];
		var comments = redis.zrevrange('ZSET:BLOG_POST:'+id+':COMMENTS',0,-1);
		for(var i=0;i<comments.length;i++){
			var comment = redis.hgetall('HSET:BLOG_POST_COMMENT:'+comments[id]);
			if(comment)
				post.comments.push(comment);
		}
		return post;
	},
	getall: function(){
		var ret = [];
		var posts = redis.zrevrange('ZSET:BLOG_POSTS',0,-1);
		for(var i=0;i<posts.length;i++){
			ret.push(this.get(posts[i]));
		}
		return ret;
	}
}

redis.run('FLUSHALL');

console.log('add 10000 posts');

for(var i=0;i<10000;i++){
	var post = blogpost.new('Title '+(Math.round(Math.random()*10000)),'body '+(Math.round(Math.random()*10000)));
	for(var r=0;r<Math.round(Math.random()*100);r++){
		blogpost.comment(post.id,'Comment Title '+(Math.round(Math.random()*10000)),'Comment body '+(Math.round(Math.random()*10000)))
	}
}

console.log('done');
//now you can do 
//time ./redis-cli js "return blogpost.getall()" #return in JSON format