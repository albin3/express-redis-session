var redis  = require('redis');
var node_hash = require('node_hash');
var redis_cli = redis.createClient();

/**
 * Express MiddleWare
 * usage: put sessions into redis
**/
exports.redis_session = function(req, res, next) {

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
  redis_cli.get(session_id, function(err, rst) {
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
      redis_cli.set(req.cookies[session_id], JSON.stringify(req.session));
      redis_cli.expire(req.cookies[session_id], 30*60);
    }
    next();
  });
}
