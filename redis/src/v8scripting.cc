#include <stdio.h>
#include <v8.h>
#include "v8scripting.h"

using namespace v8;

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

redisClient *client=NULL;



// 
// int luaRedisGenericCommand(lua_State *lua, int raise_error) {
//     int j, argc = lua_gettop(lua);
//     struct redisCommand *cmd;
//     robj **argv;
//     redisClient *c = server.lua_client;
//     sds reply;
// 
//     /* Require at least one argument */
//     if (argc == 0) {
//         luaPushError(lua,
//             "Please specify at least one argument for redis.call()");
//         return 1;
//     }
// 
//     /* Build the arguments vector */
//     argv = zmalloc(sizeof(robj*)*argc);
//     for (j = 0; j < argc; j++) {
//         if (!lua_isstring(lua,j+1)) break;
//         argv[j] = createStringObject((char*)lua_tostring(lua,j+1),
//                                      lua_strlen(lua,j+1));
//     }
//     
//     /* Check if one of the arguments passed by the Lua script
//      * is not a string or an integer (lua_isstring() return true for
//      * integers as well). */
//     if (j != argc) {
//         j--;
//         while (j >= 0) {
//             decrRefCount(argv[j]);
//             j--;
//         }
//         zfree(argv);
//         luaPushError(lua,
//             "Lua redis() command arguments must be strings or integers");
//         return 1;
//     }
// 
//     /* Setup our fake client for command execution */
//     c->argv = argv;
//     c->argc = argc;
// 
//     /* Command lookup */
//     cmd = lookupCommand(argv[0]->ptr);
//     if (!cmd || ((cmd->arity > 0 && cmd->arity != argc) ||
//                    (argc < -cmd->arity)))
//     {
//         if (cmd)
//             luaPushError(lua,
//                 "Wrong number of args calling Redis command From Lua script");
//         else
//             luaPushError(lua,"Unknown Redis command called from Lua script");
//         goto cleanup;
//     }
// 
//     /* There are commands that are not allowed inside scripts. */
//     if (cmd->flags & REDIS_CMD_NOSCRIPT) {
//         luaPushError(lua, "This Redis command is not allowed from scripts");
//         goto cleanup;
//     }
// 
//     /* Write commands are forbidden against read-only slaves, or if a
//      * command marked as non-deterministic was already called in the context
//      * of this script. */
//     if (cmd->flags & REDIS_CMD_WRITE) {
//         if (server.lua_random_dirty) {
//             luaPushError(lua,
//                 "Write commands not allowed after non deterministic commands");
//             goto cleanup;
//         } else if (server.masterhost && server.repl_slave_ro &&
//                    !(server.lua_caller->flags & REDIS_MASTER))
//         {
//             luaPushError(lua, shared.roslaveerr->ptr);
//             goto cleanup;
//         } else if (server.stop_writes_on_bgsave_err &&
//                    server.saveparamslen > 0 &&
//                    server.lastbgsave_status == REDIS_ERR)
//         {
//             luaPushError(lua, shared.bgsaveerr->ptr);
//             goto cleanup;
//         }
//     }
// 
//     /* If we reached the memory limit configured via maxmemory, commands that
//      * could enlarge the memory usage are not allowed, but only if this is the
//      * first write in the context of this script, otherwise we can't stop
//      * in the middle. */
//     if (server.maxmemory && server.lua_write_dirty == 0 &&
//         (cmd->flags & REDIS_CMD_DENYOOM))
//     {
//         if (freeMemoryIfNeeded() == REDIS_ERR) {
//             luaPushError(lua, shared.oomerr->ptr);
//             goto cleanup;
//         }
//     }
// 
//     if (cmd->flags & REDIS_CMD_RANDOM) server.lua_random_dirty = 1;
//     if (cmd->flags & REDIS_CMD_WRITE) server.lua_write_dirty = 1;
// 
//     /* Run the command */
//     c->cmd = cmd;
//     call(c,REDIS_CALL_SLOWLOG | REDIS_CALL_STATS);
// 
//     /* Convert the result of the Redis command into a suitable Lua type.
//      * The first thing we need is to create a single string from the client
//      * output buffers. */
//     reply = sdsempty();
//     if (c->bufpos) {
//         reply = sdscatlen(reply,c->buf,c->bufpos);
//         c->bufpos = 0;
//     }
//     while(listLength(c->reply)) {
//         robj *o = listNodeValue(listFirst(c->reply));
// 
//         reply = sdscatlen(reply,o->ptr,sdslen(o->ptr));
//         listDelNode(c->reply,listFirst(c->reply));
//     }
//     if (raise_error && reply[0] != '-') raise_error = 0;
//     redisProtocolToLuaType(lua,reply);
//     /* Sort the output array if needed, assuming it is a non-null multi bulk
//      * reply as expected. */
//     if ((cmd->flags & REDIS_CMD_SORT_FOR_SCRIPT) &&
//         (reply[0] == '*' && reply[1] != '-')) {
//             luaSortArray(lua);
//     }
//     sdsfree(reply);
//     c->reply_bytes = 0;
// 
// cleanup:
//     /* Clean up. Command code may have changed argv/argc so we use the
//      * argv/argc of the client instead of the local variables. */
//     for (j = 0; j < c->argc; j++)
//         decrRefCount(c->argv[j]);
//     zfree(c->argv);
// 
//     if (raise_error) {
//         /* If we are here we should have an error in the stack, in the
//          * form of a table with an "err" field. Extract the string to
//          * return the plain error. */
//         lua_pushstring(lua,"err");
//         lua_gettable(lua,-2);
//         return lua_error(lua);
//     }
//     return 1;
// }
// 


v8::Handle<v8::Value> run(const v8::Arguments& args) {
	int argc = args.Length();
	redisCommand *cmd;
	robj **argv;
	redisClient *c = client;
	sds reply;
	
	argv = (robj**)malloc(sizeof(robj*)*argc);
	
	printf("redis.run( ");
	for (int i = 0; i < args.Length(); i++) {
		v8::HandleScope handle_scope;
		v8::String::Utf8Value str(args[i]);
		const char* cstr = ToCString(str);
		char *arg = (char*)malloc(strlen(cstr));
		strcpy(arg,cstr);
		char separator = ',';
		if(i==args.Length()-1)
			separator = ' ';
		argv[i] = createStringObjectPtr(arg,strlen(arg));
		printf("\"%s\"%c", cstr, separator);
	}
	
	/* Setup our fake client for command execution */
	c->argv = argv;
	c->argc = argc;
	
	printf("command lookup\n");
	/* Command lookup */
	cmd = lookupCommandByCStringPtr((sds)argv[0]->ptr);
	if(!cmd){
		printf("no cmd '%s'!!!\n",argv[0]->ptr);
		return v8::Undefined();
	}
	printf("cmd ok\n");
	
	/* Run the command */
	c->cmd = cmd;
	printf("call cmd()\n");
	callPtr(c,0);
	
	
	printf(") executed\n");
	return v8::Undefined();
}

const char* ToCString(const v8::String::Utf8Value& value) {
	return *value ? *value : "<string conversion failed>";
}

v8::Handle<v8::Value> test(const v8::Arguments& args) {
	bool first = true;
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


void hello_world(){
	printf("Hello world v8\n");
	// Create a stack-allocated handle scope.
	HandleScope handle_scope;
	
	v8::Handle<v8::ObjectTemplate> global = v8::ObjectTemplate::New();
	v8::Handle<v8::ObjectTemplate> redis = v8::ObjectTemplate::New();
	redis->Set(v8::String::New("test"), v8::FunctionTemplate::New(test));
	redis->Set(v8::String::New("run"), v8::FunctionTemplate::New(run));
	
	global->Set(v8::String::New("test"), v8::FunctionTemplate::New(test));
	global->Set(v8::String::New("redis"), redis);
	
	// Create a new context.
	Persistent<Context> context = Context::New(NULL,global);
	
	// Enter the created context for compiling and
	// running the hello world script. 
	Context::Scope context_scope(context);
	
	// Create a string containing the JavaScript source code.
	Handle<String> source = String::New("test(new Array(100).join('Hello from v8! '));test(1,2,3);redis.test(3,2,1);redis.run('INCR','KV:V8TEST');redis.run('INCR','KV:V8TEST');redis.run('INCRBY','KV:V8TEST',10);");
	
	// Compile the source code.
	Handle<Script> script = Script::Compile(source);
	
	// Run the script to get the result.
	Handle<Value> result = script->Run();
	
	// Dispose the persistent context.
	context.Dispose();
	
	// Convert the result to an ASCII string and print it.
	String::AsciiValue ascii(result);
	printf("%s\n", *ascii);
}

extern "C"
{
	void funccpp(int i, char c, float x)
	{
		int r=0;
		int q = r+i;
		printf("\n\n\n hello!!!!!!!!\n\n");
		
		redisLogRawPtr(100,"Making redisClient\n");
		client = redisCreateClientPtr(-1);
		
		hello_world();
		redisLogRawPtr(100,"!!!\n\n\nHey hey hey\n\n\n");
		//redisLogRaw(1,"!!!!!!!!fdsfdsfsd!!!!!");
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
}
