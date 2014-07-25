Node_Express_Redis_Session
==========================

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
	var redis_session = require('./index').redis_session;
	var app     = express();
	
	app.use(...);
	
	app.use(bodyParser());
	app.use(cookieParser());
	app.use(redis_session);
	
	app.use(...);
	app.listen(3000);

###具体实现

	// MiddleWare: 序列化反序列化到Redis中
	exports.mysession = function(req, res, next) {
	
	  // 1. 产生唯一session_id
	  var session_id = 'session_id';
	  if (!req.cookies[session_id]) {
	    var time = new Date().getTime().toString();
	    var salt = 'mysalt'+Math.floor(Math.random()*100);
	    var hash = node_hash.md5(time, salt);
	    res.cookie(session_id, hash);
	    req.cookies[session_id] = hash;
	  }
	
	  // 2. 取出Session值
	  redis_session.get(session_id, function(err, rst) {
	    if (!rst) 
	      req.session = {};
	    else
	      req.session = JSON.parse(rst);
	
	    // 3. 劫持res.end，在返回前更新session
	    res._resend = res.end;
	    res.end = function(params) {
	    
	      // 4. 调用真正的res.end函数
	      res._resend(params);
	        
	      // 5. 序列化存入Redis
	      if(!req.session) req.session = {};
	      redis_session.set(req.cookies[session_id], JSON.stringify(req.session));
	      redis_session.expire(req.cookies[session_id], 30*60);
	    }
	    next();
	  });
	}

<div class="footer">
     &copy; 2014 Zeng Albin. binwei.zeng3@gmail.com
</div>
