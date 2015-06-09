Node_Express_Redis_Session
==========================
[![Build Status](https://travis-ci.org/albin3/Node_Express_Redis_Session.svg?branch=master)](https://travis-ci.org/albin3/Node_Express_Redis_Session)

###使用
	npm install node-redis-session

###简介

> 将`Session`存储在缓存中，在web服务中有诸多的优势，比如重启服务时`Session`不丢失，分布式部署web服务器时负载均衡的时候不用考虑`状态一致`的问题。

###制作原因

* `Nodejs+Express`提供的`Session`机制有时不可靠（`Session`会出现没有值的情况）；
* 金融项目自己尽量多的东西自己掌控；
* `Session`如果放在内存中，当程序调试重启时，`Session`会丢失，放在`Redis`中可避免；

###设计

1. 每个浏览器初次链接生成一个`session_id`；
2. 利用浏览器本地的`Cookie`存储`session_id`；
3. 在`Redis`中对应一个以`session_id`为键的`hmap`用于存储这次连接的所有信息；

###使用

	var express = require('express');
	var get_redis_session = require('./lib/').get_redis_session;
	var app     = express();
	
	app.use(...);
	
	app.use(bodyParser());
	app.use(cookieParser());
	app.use(get_redis_session("default"));
	
	app.use(...);
	app.listen(3000);

###具体实现

exports.get_redis_session = function(key) {
  if (!key) {
    key = "Anonymous";
  }
  var rand = Math.floor(Math.random()*100);
  key = key + rand;

  return function(req, res, next) {
    var session_id = "sid"+rand;
    if (!req.cookies[session_id]) {
      var time = new Date().getTime().toString();
      var salt = 'mysalt'+Math.floor(Math.random()*100);
      var hash = node_hash.md5(time, salt);
      res.cookie(session_id, hash);
      req.cookies[session_id] = hash;
    }

    var session_key = req.cookies[session_id];
    redis_cli.get(session_key, function(err, session_value) {
      if (!session_value) 
        req.session = {};
      else 
        req.session = JSON.parse(rst);

      res._resend = res.end;
      res.end = function(params) {
        res._resend(params);

        if(!req.session) req.session = {};
        redis_cli.set(session_key, JSON.stringify(req.session));
        redis_cli.expire(session_key, 60*60);
      }
      next();
    });
  }
};

<div class="footer">
     &copy; 2014 Zeng Albin. binwei.zeng3@gmail.com
</div>
