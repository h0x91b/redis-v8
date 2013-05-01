#include <stdio.h>
#include <v8.h>
#include <dirent.h>
#include <errno.h>
#include <pthread.h>
#include <unistd.h>
#include "v8core_js.h"
#include "v8scripting.h"

using namespace v8;

v8::Persistent<v8::Context> v8_context;

const char* ToCString(const v8::String::Utf8Value& value);
v8::Handle<v8::Value> parse_response();
char *js_dir = NULL;
char *js_flags = NULL;
int js_code_id = 0;
pthread_t thread_id_for_js_interrupt;
pthread_t thread_id_for_js_slow;
int js_timeout = 15;
int js_slow = 250;
char *last_js_run = NULL;

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
	bool special_minus_one = false;
	if(strlength==-1){
		strlength = 0;
		special_minus_one = true;
	}
	int len = strstr(replyPtr,"\r\n")-replyPtr;
	if(special_minus_one) len-=2;
	replyPtr+=len+2;
	if(strlength<4096){
		memset(bufForString,0,4096);
		strncpy(bufForString,replyPtr,strlength);
		replyPtr+=strlength+2;
		bufForString[strlength]='\0';
		//printf("line is '%s'\n",buff);
		v8::Local<v8::String> ret = v8::String::New(bufForString);
		redisReply = replyPtr;
		if(special_minus_one) return v8::Null();
		return ret;
	}
	char *buff= (char*)zmallocPtr(strlength+1);
	strncpy(buff,replyPtr,strlength);
	replyPtr+=strlength+2;
	buff[strlength]='\0';
	//printf("line is '%s'\n",buff);
	v8::Local<v8::String> ret = v8::String::New(buff);
	zfreePtr(buff);
	redisReply = replyPtr;
	if(special_minus_one) return v8::Null();
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
	int argc = args.Length();
	redisCommand *cmd;
	robj **argv;
	redisClient *c = client;
	sds reply;
	
	argv = (robj**)zmallocPtr(sizeof(robj*)*argc);
	
	for (int i = 0; i < args.Length(); i++) {
		v8::HandleScope handle_scope;
		v8::String::Utf8Value str(args[i]);
		argv[i] = createStringObjectPtr((char*)ToCString(str),strlen(ToCString(str)));
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
	if(!f) return NULL;
	fseek(f, 0, SEEK_END);
	size_t size = ftell(f);
	char* content = (char*)zmallocPtr(size+1);
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
	redis->Set(v8::String::New("__run"), v8::FunctionTemplate::New(run),ReadOnly);
	redis->Set(v8::String::New("__log"), v8::FunctionTemplate::New(redis_log),ReadOnly);
	redis->Set(v8::String::New("getLastError"), v8::FunctionTemplate::New(getLastError),ReadOnly);
	global->Set(v8::String::New("redis"), redis);
	
	// Create a new context.
	v8_context = v8::Context::New(NULL,global);
	
	// Enter the created context for compiling and
	// running the hello world script. 
	v8::Context::Scope context_scope(v8_context);
	
	v8::Handle<v8::String> source = v8::String::New((const char*)v8core_js);
	v8::Handle<v8::Script> script = v8::Script::Compile(source);
	v8::Handle<v8::Value> result = script->Run();
}

char* run_js(char *code){
	v8::HandleScope handle_scope;
	v8::Context::Scope context_scope(v8_context);
	int code_length = strlen(code);
	char *wrapcodebuf = (char*)zmallocPtr(code_length+170);
	memset(wrapcodebuf,0,code_length);
	sprintf(wrapcodebuf,"(function(){ return redis.inline_return(function(){%s}) })();",code);
	v8::Handle<v8::String> source = v8::String::New(wrapcodebuf);
	zfreePtr(wrapcodebuf);
	v8::TryCatch trycatch;
	v8::Handle<v8::Script> script = v8::Script::Compile(source);
	if(script.IsEmpty()){
		Handle<Value> exception = trycatch.Exception();
		String::AsciiValue exception_str(exception);
		printf("V8 Exception: %s\n", *exception_str);
		char *errBuf = (char*)zmallocPtr(4096); //TODO: calc size
		memset(errBuf,0,4096);
		sprintf(errBuf,"-Compile error: \"%s\"",*exception_str);
		printf("errBuf is '%s'\n",errBuf);
		pthread_cancel(thread_id_for_js_interrupt);
		pthread_cancel(thread_id_for_js_slow);
		return errBuf;
	}
	
	//v8::Locker::StartPreemption(100);
	
	v8::Handle<v8::Value> result = script->Run();
	
	if (result.IsEmpty()) {  
		Handle<Value> exception = trycatch.Exception();
		String::AsciiValue exception_str(exception);
		printf("Exception: %s\n", *exception_str);
		char *errBuf = (char*)zmallocPtr(4096); //TODO: calc size
		memset(errBuf,0,4096);
		if(!strcmp(*exception_str,"null")){
			sprintf(errBuf,"-Script runs too long, Exception error: \"%s\"",*exception_str);
		}
		else {
			sprintf(errBuf,"-Exception error: \"%s\"",*exception_str);
		}
		pthread_cancel(thread_id_for_js_interrupt);
		pthread_cancel(thread_id_for_js_slow);
		return errBuf;
	}
	v8::String::Utf8Value ascii(result);
	int size = strlen(*ascii);
	char *rez= (char*)zmallocPtr(size);
	memset(rez,0,size);
	strcpy(rez,*ascii);
	pthread_cancel(thread_id_for_js_interrupt);
	pthread_cancel(thread_id_for_js_slow);
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
		char *errBuf = (char*)zmallocPtr(4096); //TODO: calc size
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
		char *errBuf = (char*)zmallocPtr(4096); //TODO: calc size
		memset(errBuf,0,4096);
		sprintf(errBuf,"-Exception error: \"%s\"",*exception_str);
		return;
	}
	zfreePtr(core);
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
		redisLogRawPtr(REDIS_NOTICE,"js-dir from config - not found");
	}
}

struct ThreadJSClientAndCode {
	redisClient *c;
	char *code;
};

void *thread_function_for_kill_timeout_js(void *param)
{
	sleep(js_timeout);
	printf("run_js running more than %i sec, kill it\n",js_timeout);
	redisLogRawPtr(REDIS_NOTICE,(char *)"JS to slow function, kill it:");
	redisLogRawPtr(REDIS_NOTICE,(char *)last_js_run);
	v8::V8::TerminateExecution();
	return 0;
}

void *thread_function_for_slow_run_js(void *param)
{
	usleep(js_slow*1000); //js_slow is ms
	if(last_js_run!=NULL){
		printf("run_js running more than %ims, log function\n",js_slow);
		redisLogRawPtr(REDIS_NOTICE,(char *)"JS slow function:");
		redisLogRawPtr(REDIS_NOTICE,(char *)last_js_run);
	}
	return 0;
}

extern "C"
{
	void v8_exec(redisClient *c,char* code){
		//printf("v8_exec %s\n",code);
		pthread_create(&thread_id_for_js_interrupt, NULL, thread_function_for_kill_timeout_js, (void*)++js_code_id);
		pthread_create(&thread_id_for_js_slow, NULL, thread_function_for_slow_run_js, (void*)js_code_id);
		last_js_run = code;
		char *json = run_js(code);
		last_js_run = NULL;
		//TODO if reply starts with "-" than reply - error string
		robj *obj = createStringObjectPtr(json,strlen(json));
		addReplyBulkPtr(c,obj);
		zfreePtr(json);
		decrRefCountPtr(obj);
	}
	void v8_reload(redisClient *c){
		v8::Isolate* isolate = v8_context->GetIsolate();
		v8_context.Dispose(isolate);
		initV8();
		redisLogRawPtr(REDIS_NOTICE,"V8 core loaded");
		load_user_scripts_from_folder(js_dir);
		redisLogRawPtr(REDIS_NOTICE,"V8 user script loaded");
		addReplyPtr(c,createObjectPtr(REDIS_STRING,sdsnewPtr("+V8 Reload complete\r\n")));
	}
	void funccpp(int i, char c, float x)
	{
		redisLogRawPtr(REDIS_NOTICE,"Making redisClient\n");
		client = redisCreateClientPtr(-1);
		client->flags |= REDIS_LUA_CLIENT;
		
		initV8();
		
		if(js_dir==NULL){
			js_dir = (char*)zmallocPtr(1024);
			strcpy(js_dir,"./js/");
		}

		redisLogRawPtr(REDIS_NOTICE,"V8 core loaded");
		load_user_scripts_from_folder(js_dir);
		redisLogRawPtr(REDIS_NOTICE,"V8 user script loaded");
		
	}
	
	void passPointerToRedisLogRaw(void (*functionPtr)(int, char*)){
		printf("passPointerToRedisLogRaw\n");
		redisLogRawPtr = functionPtr;
	}
	
	void passPointerToCreateClient(redisClient* (*functionPtr)(int)){
		redisLogRawPtr(REDIS_DEBUG, "passPointerToCreateClient");
		redisCreateClientPtr = functionPtr;
	}
	
	//redisCommand *lookupCommand(sds name)
	void passPointerTolookupCommandByCString(redisCommand* (*functionPtr)(char*)){
		redisLogRawPtr(REDIS_DEBUG, "passPointerTolookupCommand");
		lookupCommandByCStringPtr = functionPtr;
	}
	
	void passPointerTocall(void (*functionPtr)(redisClient*,int)){
		redisLogRawPtr(REDIS_DEBUG, "passPointerTocall");
		callPtr = functionPtr;
	}
	
	void passPointerTocreateStringObject(robj* (*functionPtr)(char*,size_t)){
		redisLogRawPtr(REDIS_DEBUG, "passPointerTocreateStringObject");
		createStringObjectPtr = functionPtr;
	}
	
	void passPointerTosdsempty(sds (*functionPtr)()){
		redisLogRawPtr(REDIS_DEBUG, "passPointerTosdsempty");
		sdsemptyPtr = functionPtr;
	}
	
	void passPointerTosdscatlen(sds (*functionPtr)(sds, const void *,size_t)){
		redisLogRawPtr(REDIS_DEBUG, "passPointerTosdscatlen");
		sdscatlenPtr = functionPtr;
	}
	
	void passPointerTosdslen(size_t (*functionPtr)(const sds)){
		redisLogRawPtr(REDIS_DEBUG, "passPointerTosdslen");
		sdslenPtr = functionPtr;
	}
	
	void passPointerTolistDelNode(void (*functionPtr)(list*,listNode*)){
		redisLogRawPtr(REDIS_DEBUG, "passPointerTolistDelNode");
		listDelNodePtr = functionPtr;
	}
	
	void passPointerTodecrRefCount(void (*functionPtr)(robj*)){
		redisLogRawPtr(REDIS_DEBUG, "passPointerTodecrRefCount");
		decrRefCountPtr = functionPtr;
	}
	
	void passPointerTosdsfree(void (*functionPtr)(sds)){
		redisLogRawPtr(REDIS_DEBUG, "passPointerTosdsfree");
		sdsfreePtr = functionPtr;
	}
	
	void passPointerTozmalloc(void* (*functionPtr)(size_t)){
		redisLogRawPtr(REDIS_DEBUG, "passPointerTozmalloc");
		zmallocPtr = functionPtr;
	}
	
	void passPointerTozfree(void (*functionPtr)(void*)){
		redisLogRawPtr(REDIS_DEBUG, "passPointerTozfree");
		zfreePtr = functionPtr;
	}
	
	void passPointerToredisLog(void (*functionPtr)(int,const char*,...)){
		redisLogRawPtr(REDIS_DEBUG, "passPointerToredisLog");
		redisLogPtr = functionPtr;
	}
	
	void passPointerToaddReply(void (*functionPtr)(redisClient *, robj *)){
		redisLogRawPtr(REDIS_DEBUG, "passPointerToaddReply");
		addReplyPtr = functionPtr;
	}
	
	void passPointerTosdsnew(sds (*functionPtr)(const char*)){
		redisLogRawPtr(REDIS_DEBUG, "passPointerTosdsnew");
		sdsnewPtr = functionPtr;
	}
	
	void passPointerTocreateObject(robj* (*functionPtr)(int,void*)){
		redisLogRawPtr(REDIS_DEBUG, "passPointerTocreateObject");
		createObjectPtr = functionPtr;
	}
	
	void passPointerToaddReplyString(void (*functionPtr)(redisClient*,char *,size_t)){
		redisLogRawPtr(REDIS_DEBUG, "passPointerToaddReplyString");
		addReplyStringPtr = functionPtr;
	}
	
	void passPointerToaddReplyBulk(void (*functionPtr)(redisClient*,robj*)){
		redisLogRawPtr(REDIS_DEBUG, "passPointerToaddReplyBulkLen");
		addReplyBulkPtr = functionPtr;
	}
	
	void config_js_dir(char *_js_dir){
		printf("config_js_dir %s\n",_js_dir);
		if(js_dir) free(js_dir);
		js_dir = (char*)malloc(1024);
		strcpy(js_dir,_js_dir);
	}
	
	void config_js_flags(char *_js_flags){
		printf("config_js_flags %s\n",_js_flags);
		if(js_flags) free(js_flags);
		js_flags = (char*)malloc(1024);
		strcpy(js_flags,_js_flags);
	}
	
	void config_js_timeout(int timeout){
		printf("config_js_timeout %i\n",timeout);
		js_timeout = timeout;
	}
	
	void config_js_slow(int slow){
		printf("config_js_slow %i\n",slow);
		js_slow = slow;
	}
	
	char *config_get_js_dir(){
		return js_dir;
	}
	
	char *config_get_js_flags(){
		return js_flags;
	}
	
	int config_get_js_timeout(){
		return js_timeout;
	}
	
	int config_get_js_slow(){
		return js_slow;
	}
}
