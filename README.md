Express-Redis-Session
====

[![Build Status][travis-image]][travis-url]
[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]

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
+ `redisClient`: redis client, if exists ignore redisOptions.
+ `cookieName`: overwrite default cookie name, useful in multi products.
+ `expireTime`: cookie expire time in browser / session expire time in redis. count with ms.
+ `cacheCookieName`: multi application use sso will hold same session. and use this to hold a cache in single app. usage: `req.cache`.
+ `cookieOptions`: see third param in http://expressjs.com/zh-cn/api.html (search res.cookie).  // Object.assign({expires, httpOnly}, cookieOptions);

## Contributors

- <a href="https://github.com/albin3">albin3</a>
- <a href="https://github.com/ezeq-10">ezeq-10</a>

## Run test

```sh
$npm test
```

## [MIT Licensed](LICENSE)

[travis-image]: https://api.travis-ci.org/albin3/express-redis-session.svg
[travis-url]: https://travis-ci.org/albin3/express-redis-session
[npm-image]: https://img.shields.io/npm/v/node-redis-session.svg
[npm-url]: https://npmjs.org/package/node-redis-session
[downloads-image]: https://img.shields.io/npm/dm/node-redis-session.svg
[downloads-url]: https://npmjs.org/package/node-redis-session
