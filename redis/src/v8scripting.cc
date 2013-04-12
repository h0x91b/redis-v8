#include <stdio.h>
#include <v8.h>
#include "v8scripting.h"

using namespace v8;

//void (*pingCommandPtr)(redisClient *c);
//void (*pingCommandPtr)(redisClient);
//extern void pingCommand(redisClient *c);
//void redisLogRaw(int level, const char *msg) {
//extern void redisLogRaw(int level, const char *msg);
//void (*redisLogRawPtr)(int,const char);
void (*redisLogRawPtr)(int, char*);
//redisClient *createClient(int fd) {
redisClient* (*redisCreateClientPtr)(int);

redisClient *client=NULL;

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
	
	global->Set(v8::String::New("test"), v8::FunctionTemplate::New(test));
	global->Set(v8::String::New("redis"), redis);
	
	// Create a new context.
	Persistent<Context> context = Context::New(NULL,global);
	
	// Enter the created context for compiling and
	// running the hello world script. 
	Context::Scope context_scope(context);
	
	// Create a string containing the JavaScript source code.
	Handle<String> source = String::New("test(new Array(100).join('Hello from v8! '));test(1,2,3);redis.test(3,2,1);");
	
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
}
