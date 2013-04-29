#include <stdio.h>
#include <v8.h>
#include <dirent.h>
#include <errno.h>
#include "v8scripting.h"

using namespace v8;

v8::Persistent<v8::Context> v8_context;

const char* ToCString(const v8::String::Utf8Value& value);
v8::Handle<v8::Value> parse_response();
char *js_dir = NULL;
char *js_flags = NULL;

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

char *redisReply = NULL;
char bufForString[4096] = {0};
char lastError[4096] = {0};

v8::Handle<v8::Value> parse_string(char *replyPtr){
	//printf("parse_line_ok replyPtr[0]='%c' string length:%i\n",replyPtr[0],atoi(replyPtr));
	int strlength = atoi(replyPtr);
	int len = strstr(replyPtr,"\r\n")-replyPtr;
	replyPtr+=len+2;
	if(strlength<4096){
		memset(bufForString,0,4096);
		strncpy(bufForString,replyPtr,strlength);
		replyPtr+=strlength+2;
		bufForString[strlength]='\0';
		//printf("line is '%s'\n",buff);
		v8::Local<v8::String> ret = v8::String::New(bufForString);
		redisReply = replyPtr;
		return ret;
	}
	char *buff= (char*)malloc(strlength+1);
	strncpy(buff,replyPtr,strlength);
	replyPtr+=strlength+2;
	buff[strlength]='\0';
	//printf("line is '%s'\n",buff);
	v8::Local<v8::String> ret = v8::String::New(buff);
	free(buff);
	redisReply = replyPtr;
	return ret;
}

v8::Handle<v8::Value> parse_error(char *replyPtr){
	int len = strstr(replyPtr,"\r\n")-replyPtr;
	memset(lastError,0,4096);
	strncpy(lastError,replyPtr,len);
	replyPtr+=len+2;
	redisReply = replyPtr;
	printf("lastError set to '%s'\n",lastError);
	return v8::Boolean::New(false);
}

v8::Handle<v8::Value> parse_bulk(char *replyPtr){
	int arr_length = atoi(replyPtr);
	int len = strstr(replyPtr,"\r\n")-replyPtr;
	replyPtr+=len+2;
	redisReply = replyPtr;
	v8::Local<v8::Array> ret = v8::Array::New(arr_length);
	for(int i=0;i<arr_length;i++){
		ret->Set(v8::Number::New(i), parse_response());
	}
	return ret;
}


v8::Handle<v8::Value> parse_response(){
	char *replyPtr = redisReply;
	//printf("replyPtr[0]='%c' reply='%s'\n",replyPtr[0],replyPtr);
	switch(replyPtr[0]){
		case '+':
			return v8::Boolean::New(true);
		case '-':
			return parse_error(++replyPtr);
		case ':':
			return v8::Integer::New(atoi(++replyPtr));
		case '$':
			return parse_string(++replyPtr);
		case '*':
			return parse_bulk(++replyPtr);
		default:
			printf("cant parse reply %s\n",replyPtr);
	}
	return v8::Undefined();
}

v8::Handle<v8::Value> getLastError(const v8::Arguments& args) {
	return v8::String::New(lastError);
}


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
		printf("no cmd '%s'!!!\n",(char*)argv[0]->ptr);
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
		reply = sdscatlenPtr(reply,o->ptr,strlen((const char*)o->ptr));
		listDelNodePtr(c->reply,listFirst(c->reply));
	}
	
	redisReply = reply;
	v8::Handle<v8::Value> ret_value= parse_response();
	v8::Local<v8::String> v8reply = v8::String::New(reply);
	
	sdsfreePtr(reply);
	c->reply_bytes = 0;
	
	for (int j = 0; j < c->argc; j++)
		decrRefCountPtr(c->argv[j]);
	zfreePtr(c->argv);
	
	return ret_value;
	//return v8reply;
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

v8::Handle<v8::Value> redis_log(const v8::Arguments& args) {
	if(args.Length()>=2){
		Local<Integer> i = Local<Integer>::Cast(args[0]);
		int log_level = (int)(i->Int32Value());
		v8::String::Utf8Value str(args[1]);
		const char* cstr = ToCString(str);
		redisLogRawPtr(log_level,(char *)cstr);
	}
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
	if(js_flags){
		v8::V8::SetFlagsFromString(
			js_flags,
			strlen(js_flags)
		);
	}
	
	v8::HandleScope handle_scope;
	
	v8::Handle<v8::ObjectTemplate> global = v8::ObjectTemplate::New();
	v8::Handle<v8::ObjectTemplate> redis = v8::ObjectTemplate::New();
	redis->Set(v8::String::New("test"), v8::FunctionTemplate::New(test), ReadOnly);
	redis->Set(v8::String::New("__run"), v8::FunctionTemplate::New(run));
	redis->Set(v8::String::New("__log"), v8::FunctionTemplate::New(redis_log));
	redis->Set(v8::String::New("getLastError"), v8::FunctionTemplate::New(getLastError));
	
	global->Set(v8::String::New("test"), v8::FunctionTemplate::New(test), ReadOnly);
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
	int step = 0;
	v8::HandleScope handle_scope;
	v8::Context::Scope context_scope(v8_context);
	int code_length = strlen(code);
	char *wrapcodebuf = (char*)malloc(code_length+170);
	memset(wrapcodebuf,0,code_length);
	sprintf(wrapcodebuf,"(function(){ return redis.inline_return(function(){%s}) })();",code);
	v8::Handle<v8::String> source = v8::String::New(wrapcodebuf);
	free(wrapcodebuf);
	v8::TryCatch trycatch;
	v8::Handle<v8::Script> script = v8::Script::Compile(source);
	if(script.IsEmpty()){
		Handle<Value> exception = trycatch.Exception();
		String::AsciiValue exception_str(exception);
		printf("V8 Exception: %s\n", *exception_str);
		char *errBuf = (char*)malloc(4096); //TODO: calc size
		memset(errBuf,0,4096);
		sprintf(errBuf,"-Compile error: \"%s\"",*exception_str);
		printf("errBuf is '%s'\n",errBuf);
		return errBuf;
	}
	v8::Handle<v8::Value> result = script->Run();
	if (result.IsEmpty()) {  
		Handle<Value> exception = trycatch.Exception();
		String::AsciiValue exception_str(exception);
		printf("Exception: %s\n", *exception_str);
		char *errBuf = (char*)malloc(4096); //TODO: calc size
		memset(errBuf,0,4096);
		sprintf(errBuf,"-Exception error: \"%s\"",*exception_str);
		return errBuf;
	}
	v8::String::Utf8Value ascii(result);
	int size = strlen(*ascii);
	char *rez= (char*)malloc(size);
	memset(rez,0,size);
	strcpy(rez,*ascii);
	return rez;
}

void load_user_script(char *file){
	v8::HandleScope handle_scope;
	v8::Context::Scope context_scope(v8_context);
	char* core = file_get_contents(file);
	v8::Handle<v8::String> source = v8::String::New(core);
	v8::TryCatch trycatch;
	v8::Handle<v8::Script> script = v8::Script::Compile(source);
	if(script.IsEmpty()){
		Handle<Value> exception = trycatch.Exception();
		String::AsciiValue exception_str(exception);
		printf("V8 Exception: %s\n", *exception_str);
		char *errBuf = (char*)malloc(4096); //TODO: calc size
		memset(errBuf,0,4096);
		sprintf(errBuf,"-Compile error: \"%s\"",*exception_str);
		printf("errBuf is '%s'\n",errBuf);
		return;
	}
	v8::Handle<v8::Value> result = script->Run();
	if (result.IsEmpty()) {  
		Handle<Value> exception = trycatch.Exception();
		String::AsciiValue exception_str(exception);
		printf("Exception: %s\n", *exception_str);
		char *errBuf = (char*)malloc(4096); //TODO: calc size
		memset(errBuf,0,4096);
		sprintf(errBuf,"-Exception error: \"%s\"",*exception_str);
		return;
	}
	free(core);
	v8::String::AsciiValue ascii(result);
	printf("%s\n", *ascii);
}

void load_user_scripts_from_folder(char *folder){
	DIR *dp;
	struct dirent *dirp;
	unsigned char isFolder =0x4;
	int len = 0;
	if((dp  = opendir(folder)) != NULL) {
		while ((dirp = readdir(dp)) != NULL) {
			//files.push_back(string(dirp->d_name));
			if(strcmp(".", dirp->d_name) && strcmp("..", dirp->d_name)){
				len = strlen (dirp->d_name);
				if(dirp->d_type == isFolder){
					char subfolder[1024] = {0};
					sprintf(subfolder,"%s%s/",folder,dirp->d_name);
					load_user_scripts_from_folder(subfolder);
				}
				else if(strcmp (".js", &(dirp->d_name[len - 3])) == 0){
					char file[1024] = {0};
					sprintf(file,"%s%s",folder,dirp->d_name);
					redisLogRawPtr(REDIS_NOTICE,file);
					load_user_script(file);
				}
			}
		}
		closedir(dp);
	} else {
		redisLogRawPtr(REDIS_NOTICE,"js-dir from config - not found\n");
	}
}

extern "C"
{
	void v8_exec(redisClient *c,char* code){
		//printf("v8_exec %s\n",code);
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
		redisLogRawPtr(REDIS_NOTICE,"Making redisClient\n");
		client = redisCreateClientPtr(-1);
		client->flags |= REDIS_LUA_CLIENT;
		
		initV8();
		
		if(js_dir==NULL){
			js_dir = (char*)malloc(1024);
			strcpy(js_dir,"./js/");
		}

		// run_corejs_test();
		// run_corejs_test();
		// run_corejs_test();
		
		redisLogRawPtr(REDIS_NOTICE,"V8 core loaded");
		load_user_scripts_from_folder(js_dir);
		redisLogRawPtr(REDIS_NOTICE,"V8 user script loaded");
		
	}
	
	void passPointerToRedisLogRaw(void (*functionPtr)(int, char*)){
		printf("passPointerToRedisLogRaw\n");
		redisLogRawPtr = functionPtr;
	}
	
	void passPointerToCreateClient(redisClient* (*functionPtr)(int)){
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
	
	void config_js_dir(char *_js_dir){
		printf("config_js_dir %s\n",_js_dir);
		js_dir = (char*)malloc(1024);
		strcpy(js_dir,_js_dir);
	}
	
	void config_js_flags(char *_js_flags){
		printf("config_js_flags %s\n",_js_flags);
		js_flags = (char*)malloc(1024);
		strcpy(js_flags,_js_flags);
	}
}
