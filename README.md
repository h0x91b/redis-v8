redis_v8
========

experiment

Currently work only on OSX with 32bit

You will need v8 =)

<code>cd redis/deps/</code>

<code>git clone git@github.com:v8/v8.git</code>

Now you can make a redis

<code>cd redis/</code>

<code>make V=1 32bit</code>

<code>make V=1 32bit #yeah twice, have some problem in makefile...</code>
