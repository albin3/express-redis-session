Node-Express-Redis-Session
====
[![Build Status](https://travis-ci.org/albin3/express-redis-session.svg?branch=master)](https://travis-ci.org/albin3/express-redis-session)

This is a node Express middleware to store session into redis.

Install with:

```sh
$npm install node-redis-session
```

## Usage

```js

var express = require('express');
var cookieParser = require('cookie-parser');
var redisSession = require('node-redis-session');
var app = express();

app.use(cookieParser());
app.use(redisSession());

app.get('/', function(req, res) {
	
  //just use req.session and it will be there,
  //when next same browser request come.
  if (!req.session.user) {
    req.session.user = {name: 'anonymous'};
  }
    
  res.end('hello '+req.session.user.name);
});

app.listen(3000);
```
Session will be store in redis, as JSON.stringify(req.session). You can find it with redis command line.

## redisSession(options)
Other way to establish a redisSession is: 

```js

var express = require('express');
var cookieParser = require('cookie-parser');
var redisSession = require('node-redis-session');
var app = express();

app.use(cookieParser());
app.use(redisSession({ cookieName: 'mySessionid' }));
```
So cookie-name in browser will be set as `mySessionid`. It's useful when multi projects are use redisSession. Do this and escape projects from use same cookie-name.

## Options

+ `redisOptions`: configure redis, must be a array. ex: `[6379, 'localhost', {auth_pass: 'auth_pass'}]`
+ `cookieName`: overwrite default cookie name, useful in multi products.
+ `expireTime`: cookie expire time in browser / session expire time in redis. count with ms.

## Contributors

- <a href="https://github.com/albin3">albin3</a>
- <a href="https://github.com/ezeq-10">ezeq-10</a>

## Run test

```sh
$npm test
```

## [MIT Licensed](LICENSE)
