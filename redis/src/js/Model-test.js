function doModelTest(){
	var author = Model('author',{
		name: 'h0x91B',
		carma: 100
	})

	for(var i=0;i<50;i++){
		var post = Model('post', {
			author: author.id,
			title: 'some title',
			body: 'some body',
			rating: ~~(Math.random()*1000)
		});
		for(var n=0; n<50; n++){
			Model('post:'+post.id+':comment',{
				title: 'comment title',
				body: 'comment body',
				author: author.id
			})
		}
	}

	console.log('model test',
		Model('post')
			.head(100)
			.where('id',function(id){
				return id % 2;
			})
			.where('id',function(id){
				return id > 50;
			})
			.getAll()
			.orderBy('rating','DESC')
			.limit(10)
			.each(function(post){
				post.author = Model('author').get(post.author);
				post.comments = Model('post:'+post.id+':comment')
									.head(3)
									.getAll()
									.each(function(comment){
										comment.author = Model('author').get(comment.author);
									})
			})
	);
}

function testModelDel(){
	Model('test',{something: 'dsfsd'});
	Model('test',{something: 'dsfsd'});
	Model('test',{something: 'dsfsd'});
	Model('test').where('id', function(id){
		return id>1;
	}).del();
}

function testModelModifyAndSave(){
	Model('test2',{something: 'dsfsd'});
	var test = Model('test2',{something: 'dsfsd2'});
	Model('test2',{something: 'dsfsd3'});
	Model('test2').where().getAll().attr('something','something').save();
	Model('test2',test.id).attr('something','FDFDSFSDFSDF').save();
	console.log('get by id',Model('test2',test.id));
}
