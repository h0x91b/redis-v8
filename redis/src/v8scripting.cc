#include <stdio.h>
#include <v8.h>
#include "v8scripting.h"

using namespace v8;
//using namespace v8::internal;
//using v8::internal::Runtime;

v8::Persistent<v8::Context> v8_context;

const char* ToCString(const v8::String::Utf8Value& value);

//void (*pingCommandPtr)(redisClient *c);
//void (*pingCommandPtr)(redisClient);
//extern void pingCommand(redisClient *c);
//void redisLogRaw(int level, const char *msg) {
//extern void redisLogRaw(int level, const char *msg);
//void (*redisLogRawPtr)(int,const char);
void (*redisLogRawPtr)(int, char*);
//redisClient *createClient(int fd) {
redisClient* (*redisCreateClientPtr)(int);
redisCommand* (*lookupCommandByCStringPtr)(char*);
//void call(redisClient *c, int flags) {
void (*callPtr)(redisClient*,int);
//robj *createStringObject(char *ptr, size_t len) {
robj* (*createStringObjectPtr)(char*,size_t);
//sds sdsempty(void)
sds (*sdsemptyPtr)();
//sds sdscatlen(sds s, const void *t, size_t len)
sds (*sdscatlenPtr)(sds, const void *,size_t);
//size_t sdslen(const sds s)
size_t (*sdslenPtr)(const sds);
//void listDelNode(list *list, listNode *node)
void (*listDelNodePtr)(list*,listNode*);
//void decrRefCount(robj *o)
void (*decrRefCountPtr)(robj*);
//void sdsfree(sds s)
void (*sdsfreePtr)(sds);
//void *zmalloc(size_t size)
void* (*zmallocPtr)(size_t);
//void zfree(void *ptr)
void (*zfreePtr)(void*);
//void redisLog(int level, const char *fmt, ...)
void (*redisLogPtr)(int,const char*,...);
//void addReply(redisClient *c, robj *obj)
void (*addReplyPtr)(redisClient *, robj *);
//sds sdsnew(const char *init)
sds (*sdsnewPtr)(const char*);
//robj *createObject(int type, void *ptr)
robj* (*createObjectPtr)(int,void*);
//void addReplyString(redisClient *c, char *s, size_t len)
void (*addReplyStringPtr)(redisClient*,char *,size_t);
//void addReplyBulk(redisClient *c, robj *obj)
void (*addReplyBulkPtr)(redisClient*,robj*);

redisClient *client=NULL;



// 
// int luaRedisGenericCommand(lua_State *lua, int raise_error) {
//	 int j, argc = lua_gettop(lua);
//	 struct redisCommand *cmd;
//	 robj **argv;
//	 redisClient *c = server.lua_client;
//	 sds reply;
// 
//	 /* Require at least one argument */
//	 if (argc == 0) {
//		 luaPushError(lua,
//			 "Please specify at least one argument for redis.call()");
//		 return 1;
//	 }
// 
//	 /* Build the arguments vector */
//	 argv = zmalloc(sizeof(robj*)*argc);
//	 for (j = 0; j < argc; j++) {
//		 if (!lua_isstring(lua,j+1)) break;
//		 argv[j] = createStringObject((char*)lua_tostring(lua,j+1),
//									  lua_strlen(lua,j+1));
//	 }
//	 
//	 /* Check if one of the arguments passed by the Lua script
//	  * is not a string or an integer (lua_isstring() return true for
//	  * integers as well). */
//	 if (j != argc) {
//		 j--;
//		 while (j >= 0) {
//			 decrRefCount(argv[j]);
//			 j--;
//		 }
//		 zfree(argv);
//		 luaPushError(lua,
//			 "Lua redis() command arguments must be strings or integers");
//		 return 1;
//	 }
// 
//	 /* Setup our fake client for command execution */
//	 c->argv = argv;
//	 c->argc = argc;
// 
//	 /* Command lookup */
//	 cmd = lookupCommand(argv[0]->ptr);
//	 if (!cmd || ((cmd->arity > 0 && cmd->arity != argc) ||
//					(argc < -cmd->arity)))
//	 {
//		 if (cmd)
//			 luaPushError(lua,
//				 "Wrong number of args calling Redis command From Lua script");
//		 else
//			 luaPushError(lua,"Unknown Redis command called from Lua script");
//		 goto cleanup;
//	 }
// 
//	 /* There are commands that are not allowed inside scripts. */
//	 if (cmd->flags & REDIS_CMD_NOSCRIPT) {
//		 luaPushError(lua, "This Redis command is not allowed from scripts");
//		 goto cleanup;
//	 }
// 
//	 /* Write commands are forbidden against read-only slaves, or if a
//	  * command marked as non-deterministic was already called in the context
//	  * of this script. */
//	 if (cmd->flags & REDIS_CMD_WRITE) {
//		 if (server.lua_random_dirty) {
//			 luaPushError(lua,
//				 "Write commands not allowed after non deterministic commands");
//			 goto cleanup;
//		 } else if (server.masterhost && server.repl_slave_ro &&
//					!(server.lua_caller->flags & REDIS_MASTER))
//		 {
//			 luaPushError(lua, shared.roslaveerr->ptr);
//			 goto cleanup;
//		 } else if (server.stop_writes_on_bgsave_err &&
//					server.saveparamslen > 0 &&
//					server.lastbgsave_status == REDIS_ERR)
//		 {
//			 luaPushError(lua, shared.bgsaveerr->ptr);
//			 goto cleanup;
//		 }
//	 }
// 
//	 /* If we reached the memory limit configured via maxmemory, commands that
//	  * could enlarge the memory usage are not allowed, but only if this is the
//	  * first write in the context of this script, otherwise we can't stop
//	  * in the middle. */
//	 if (server.maxmemory && server.lua_write_dirty == 0 &&
//		 (cmd->flags & REDIS_CMD_DENYOOM))
//	 {
//		 if (freeMemoryIfNeeded() == REDIS_ERR) {
//			 luaPushError(lua, shared.oomerr->ptr);
//			 goto cleanup;
//		 }
//	 }
// 
//	 if (cmd->flags & REDIS_CMD_RANDOM) server.lua_random_dirty = 1;
//	 if (cmd->flags & REDIS_CMD_WRITE) server.lua_write_dirty = 1;
// 
//	 /* Run the command */
//	 c->cmd = cmd;
//	 call(c,REDIS_CALL_SLOWLOG | REDIS_CALL_STATS);
// 
//	 /* Convert the result of the Redis command into a suitable Lua type.
//	  * The first thing we need is to create a single string from the client
//	  * output buffers. */
//	 reply = sdsempty();
//	 if (c->bufpos) {
//		 reply = sdscatlen(reply,c->buf,c->bufpos);
//		 c->bufpos = 0;
//	 }
//	 while(listLength(c->reply)) {
//		 robj *o = listNodeValue(listFirst(c->reply));
// 
//		 reply = sdscatlen(reply,o->ptr,sdslen(o->ptr));
//		 listDelNode(c->reply,listFirst(c->reply));
//	 }
//	 if (raise_error && reply[0] != '-') raise_error = 0;
//	 redisProtocolToLuaType(lua,reply);
//	 /* Sort the output array if needed, assuming it is a non-null multi bulk
//	  * reply as expected. */
//	 if ((cmd->flags & REDIS_CMD_SORT_FOR_SCRIPT) &&
//		 (reply[0] == '*' && reply[1] != '-')) {
//			 luaSortArray(lua);
//	 }
//	 sdsfree(reply);
//	 c->reply_bytes = 0;
// 
// cleanup:
//	 /* Clean up. Command code may have changed argv/argc so we use the
//	  * argv/argc of the client instead of the local variables. */
//	 for (j = 0; j < c->argc; j++)
//		 decrRefCount(c->argv[j]);
//	 zfree(c->argv);
// 
//	 if (raise_error) {
//		 /* If we are here we should have an error in the stack, in the
//		  * form of a table with an "err" field. Extract the string to
//		  * return the plain error. */
//		 lua_pushstring(lua,"err");
//		 lua_gettable(lua,-2);
//		 return lua_error(lua);
//	 }
//	 return 1;
// }
// 


v8::Handle<v8::Value> run(const v8::Arguments& args) {
	//return v8::String::New("$11\nhello\nworld\n");
	//return v8::String::New("+OK");
	int argc = args.Length();
	redisCommand *cmd;
	robj **argv;
	redisClient *c = client;
	sds reply;
	
	//argv = (robj**)malloc(sizeof(robj*)*argc);
	argv = (robj**)zmallocPtr(sizeof(robj*)*argc);
	
	for (int i = 0; i < args.Length(); i++) {
		v8::HandleScope handle_scope;
		v8::String::Utf8Value str(args[i]);
		
		/*
		const char* cstr = ToCString(str);
		char *arg = (char*)malloc(strlen(cstr));
		strcpy(arg,cstr);
		char separator = ',';
		if(i==args.Length()-1)
			separator = ' ';
		argv[i] = createStringObjectPtr(arg,strlen(arg));
		*/
		argv[i] = createStringObjectPtr((char*)ToCString(str),strlen(ToCString(str)));
		//		 argv[j] = createStringObject((char*)lua_tostring(lua,j+1),
		//									  lua_strlen(lua,j+1));
		
	}
	
	/* Setup our fake client for command execution */
	c->argv = argv;
	c->argc = argc;
	
	/* Command lookup */
	cmd = lookupCommandByCStringPtr((sds)argv[0]->ptr);
	if(!cmd){
		printf("no cmd '%s'!!!\n",argv[0]->ptr);
		return v8::Undefined();
	}
	
	/* Run the command */
	c->cmd = cmd;
	callPtr(c,REDIS_CALL_SLOWLOG | REDIS_CALL_STATS);
	
	reply = sdsemptyPtr();
		
	if (c->bufpos) {
		reply = sdscatlenPtr(reply,c->buf,c->bufpos);
		c->bufpos = 0;
	}
	
	while(listLength(c->reply)) {
		robj *o = (robj*)listNodeValue(listFirst(c->reply));

		reply = sdscatlenPtr(reply,o->ptr,sdslenPtr((const sds)o->ptr));
		listDelNodePtr(c->reply,listFirst(c->reply));
	}
	
	v8::Local<v8::String> v8reply = v8::String::New(reply);
	
	sdsfreePtr(reply);
	c->reply_bytes = 0;
	
	for (int j = 0; j < c->argc; j++)
		decrRefCountPtr(c->argv[j]);
	zfreePtr(c->argv);
	
	return v8reply;
}

char *file_get_contents(char *filename)
{
	FILE* f = fopen(filename, "r");
	fseek(f, 0, SEEK_END);
	size_t size = ftell(f);
	char* content = (char*)malloc(size+1);
	memset(content,0,size);
	rewind(f);
	fread(content, sizeof(char), size, f);
	content[size] = '\0';
	return content;
}

const char* ToCString(const v8::String::Utf8Value& value) {
	return *value ? *value : "<string conversion failed>";
}

v8::Handle<v8::Value> optimize(const v8::Arguments& args) {
	printf("optimize call\n");
	v8::Persistent<v8::Function> fn = v8::Persistent<v8::Function>::New(v8::Handle<v8::Function>::Cast(args[0]));
	//Runtime::Runtime_OptimizeFunctionOnNextCall(fn,1);
	//fn->MarkForLazyRecompilation();
	//Handle<JSFunction> fun(JSFunction::cast(v8::Handle<v8::Object>::Cast(args[0])));
	return v8::Undefined();
}

v8::Handle<v8::Value> test(const v8::Arguments& args) {
	bool first = true;
	printf("c++ test function()\n");
	for (int i = 0; i < args.Length(); i++) {
		v8::HandleScope handle_scope;
		if (first) {
			first = false;
		} else {
			printf(" ");
		}
		v8::String::Utf8Value str(args[i]);
		const char* cstr = ToCString(str);
		printf("%s", cstr);
	}
	printf("\n");
	fflush(stdout);
	return v8::Undefined();
}

void initV8(){
	v8::V8::SetFlagsFromString(
		"--trace_opt --trace_deopt --allow_natives_syntax",
		strlen(
		"--trace_opt --trace_deopt --allow_natives_syntax"
		)
	);
	i::FLAG_allow_natives_syntax = true;
	
	v8::HandleScope handle_scope;
	
	v8::Handle<v8::ObjectTemplate> global = v8::ObjectTemplate::New();
	v8::Handle<v8::ObjectTemplate> redis = v8::ObjectTemplate::New();
	redis->Set(v8::String::New("test"), v8::FunctionTemplate::New(test));
	redis->Set(v8::String::New("__run"), v8::FunctionTemplate::New(run));
	
	global->Set(v8::String::New("test"), v8::FunctionTemplate::New(test));
	global->Set(v8::String::New("optimize"), v8::FunctionTemplate::New(optimize));
	global->Set(v8::String::New("redis"), redis);
	
	// Create a new context.
	v8_context = v8::Context::New(NULL,global);
	
	// Enter the created context for compiling and
	// running the hello world script. 
	v8::Context::Scope context_scope(v8_context);
	
	// Create a string containing the JavaScript source code.
	char* core = file_get_contents("../../core.js");
	v8::Handle<v8::String> source = v8::String::New(core);
	free(core);
	
	// Compile the source code.
	v8::Handle<v8::Script> script = v8::Script::Compile(source);
	
	// Run the script to get the result.
	v8::Handle<v8::Value> result = script->Run();
	
	// Dispose the persistent context.
	//context.Dispose();
	
	// Convert the result to an ASCII string and print it.
	v8::String::AsciiValue ascii(result);
	printf("core.js return %s\n", *ascii);
}

void run_corejs_test(){
	v8::HandleScope handle_scope;
	v8::Context::Scope context_scope(v8_context);
	char* core = file_get_contents("../../coretest.js");
	v8::Handle<v8::String> source = v8::String::New(core);
	v8::Handle<v8::Script> script = v8::Script::Compile(source);
	v8::Handle<v8::Value> result = script->Run();
	free(core);
	v8::String::AsciiValue ascii(result);
	printf("%s\n", *ascii);
}

char* run_js(char *code){
	v8::HandleScope handle_scope;
	v8::Context::Scope context_scope(v8_context);
	v8::Handle<v8::String> source = v8::String::New(code);
	v8::Handle<v8::Script> script = v8::Script::Compile(source);
	v8::Handle<v8::Value> result = script->Run();
	v8::String::AsciiValue ascii(result);
	printf("run_js '%s'\n", *ascii);
	int size = strlen(*ascii);
	char *rez= (char*)malloc(size);
	memset(rez,0,size);
	strcpy(rez,*ascii);
	return rez;
}

void hello_world(){
	printf("Hello world v8\n");
	
	/*
	static const char v8Flags [ ] = "--expose-gc";
	V8::SetFlagsFromString (v8Flags, sizeof (v8Flags) - 1);
	*/
	v8::V8::SetFlagsFromString(
		"--trace_opt --trace_deopt --allow_natives_syntax",
		strlen(
		"--trace_opt --trace_deopt --allow_natives_syntax"
		)
	);
	i::FLAG_allow_natives_syntax = true;
	
	// Create a stack-allocated handle scope.
	v8::HandleScope handle_scope;
	
	v8::Handle<v8::ObjectTemplate> global = v8::ObjectTemplate::New();
	v8::Handle<v8::ObjectTemplate> redis = v8::ObjectTemplate::New();
	redis->Set(v8::String::New("test"), v8::FunctionTemplate::New(test));
	redis->Set(v8::String::New("__run"), v8::FunctionTemplate::New(run));
	
	global->Set(v8::String::New("test"), v8::FunctionTemplate::New(test));
	global->Set(v8::String::New("optimize"), v8::FunctionTemplate::New(optimize));
	global->Set(v8::String::New("redis"), redis);
	
	// Create a new context.
	v8::Persistent<v8::Context> context = v8::Context::New(NULL,global);
	
	// Enter the created context for compiling and
	// running the hello world script. 
	v8::Context::Scope context_scope(context);
	
	// Create a string containing the JavaScript source code.
	char* core = file_get_contents("../../core.js");
	v8::Handle<v8::String> source = v8::String::New(core);
	
	// Compile the source code.
	v8::Handle<v8::Script> script = v8::Script::Compile(source);
	
	// Run the script to get the result.
	v8::Handle<v8::Value> result = script->Run();
	
	// Dispose the persistent context.
	context.Dispose();
	
	// Convert the result to an ASCII string and print it.
	v8::String::AsciiValue ascii(result);
	printf("%s\n", *ascii);
}

extern "C"
{
	void v8_exec(redisClient *c,char* code){
		printf("v8_exec %s\n",code);
		char *json = run_js(code);
		//addReplyStringPtr(c,json,strlen(json));
		//void addReplyBulkLen(redisClient *c, robj *obj)
		robj *obj = createStringObjectPtr(json,strlen(json));
		addReplyBulkPtr(c,obj);
		free(json);
		decrRefCountPtr(obj);
		//addReplyPtr(c,createObjectPtr(REDIS_STRING,sdsnewPtr("+V8\r\n")));
	}
	void funccpp(int i, char c, float x)
	{
		int r=0;
		int q = r+i;
		printf("\n\n\n hello!!!!!!!!\n\n");
		
		redisLogRawPtr(100,"Making redisClient\n");
		client = redisCreateClientPtr(-1);
		client->flags |= REDIS_LUA_CLIENT;
		
		//hello_world();
		initV8();
		//run_corejs_test();
		//run_corejs_test();
		//run_corejs_test();
		
		redisLogRawPtr(REDIS_NOTICE,"V8 core loaded");
	}
	
	//void (*redisLogRawPtr)(int,const char);
	void passPointerToRedisLogRaw(void (*functionPtr)(int, char*))
	{
		printf("passPointerToRedisLogRaw\n");
		redisLogRawPtr = functionPtr;
	}
	
	//redisClient *createClient(int fd) {
	void passPointerToCreateClient(redisClient* (*functionPtr)(int))
	{
		printf("passPointerToCreateClient\n");
		redisCreateClientPtr = functionPtr;
	}
	
	//redisCommand *lookupCommand(sds name)
	void passPointerTolookupCommandByCString(redisCommand* (*functionPtr)(char*)){
		printf("passPointerTolookupCommand\n");
		lookupCommandByCStringPtr = functionPtr;
	}
	
	void passPointerTocall(void (*functionPtr)(redisClient*,int)){
		printf("passPointerTocall\n");
		callPtr = functionPtr;
	}
	
	void passPointerTocreateStringObject(robj* (*functionPtr)(char*,size_t)){
		printf("passPointerTocreateStringObject\n");
		createStringObjectPtr = functionPtr;
	}
	
	void passPointerTosdsempty(sds (*functionPtr)()){
		printf("passPointerTosdsempty\n");
		sdsemptyPtr = functionPtr;
	}
	
	void passPointerTosdscatlen(sds (*functionPtr)(sds, const void *,size_t)){
		printf("passPointerTosdscatlen\n");
		sdscatlenPtr = functionPtr;
	}
	
	void passPointerTosdslen(size_t (*functionPtr)(const sds)){
		printf("passPointerTosdslen\n");
		sdslenPtr = functionPtr;
	}
	
	void passPointerTolistDelNode(void (*functionPtr)(list*,listNode*)){
		printf("passPointerTolistDelNode\n");
		listDelNodePtr = functionPtr;
	}
	
	void passPointerTodecrRefCount(void (*functionPtr)(robj*)){
		printf("passPointerTodecrRefCount\n");
		decrRefCountPtr = functionPtr;
	}
	
	void passPointerTosdsfree(void (*functionPtr)(sds)){
		printf("passPointerTosdsfree\n");
		sdsfreePtr = functionPtr;
	}
	
	void passPointerTozmalloc(void* (*functionPtr)(size_t)){
		printf("passPointerTozmalloc\n");
		zmallocPtr = functionPtr;
	}
	
	void passPointerTozfree(void (*functionPtr)(void*)){
		printf("passPointerTozfree\n");
		zfreePtr = functionPtr;
	}
	
	void passPointerToredisLog(void (*functionPtr)(int,const char*,...)){
		printf("passPointerToredisLog\n");
		redisLogPtr = functionPtr;
	}
	
	void passPointerToaddReply(void (*functionPtr)(redisClient *, robj *)){
		printf("passPointerToaddReply\n");
		addReplyPtr = functionPtr;
	}
	
	void passPointerTosdsnew(sds (*functionPtr)(const char*)){
		printf("passPointerTosdsnew\n");
		sdsnewPtr = functionPtr;
	}
	
	void passPointerTocreateObject(robj* (*functionPtr)(int,void*)){
		printf("passPointerTocreateObject\n");
		createObjectPtr = functionPtr;
	}
	
	void passPointerToaddReplyString(void (*functionPtr)(redisClient*,char *,size_t)){
		printf("passPointerToaddReplyString\n");
		addReplyStringPtr = functionPtr;
	}
	
	void passPointerToaddReplyBulk(void (*functionPtr)(redisClient*,robj*)){
		printf("passPointerToaddReplyBulkLen\n");
		addReplyBulkPtr = functionPtr;
	}
}
