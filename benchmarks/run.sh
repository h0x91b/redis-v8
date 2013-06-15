#!/bin/bash

echo ====================================================================
echo Insert 500 posts with 100 comments by PHP without pipelining
php insert500.php
echo ====================================================================
echo Insert 500 posts with 100 comments by PHP with pipelining
php insert500pipe.php
echo ====================================================================
echo Insert 500 posts with 100 comments by PHP + redis-v8
php insert500v8.php
echo ====================================================================
echo Get 1500 posts with 100 comments by PHP without pipelining
php get1500.php
echo ====================================================================
echo Get 1500 posts with 100 comments by PHP with pipelining
php get1500pipe.php
echo ====================================================================
echo Get 1500 posts with 100 comments by PHP + redis-v8
php get1500v8.php
echo ====================================================================