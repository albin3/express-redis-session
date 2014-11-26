var redis  = require('redis');
var crypto = require('crypto');
var redis_cli = redis.createClient();

/**
 * 劫持express的end函数，每次访问时，将session从redis中取出，
 * 挂载到req.session中，访问结束时，更新后放回到redis中.
 * PS: 这个函数与下面的函数功能一样，闭包函数
 */
exports.get_redis_session = function(key) {
  if (!key) {
    key = "default";
  }
  // var rand = Math.floor(Math.random()*100);
  // key = key + rand;

  return function(req, res, next) {
    var session_id = "sid#"+key;
    if (!req.cookies[session_id]) {
      var hash = crypto.randomBytes(32)
                  .toString('base64')   // convert to base64 format
                  .replace(/\+/g, '0')  // replace '+' with '0'
                  .replace(/\//g, '0'); // replace '/' with '0'
      hash = "Session|"+key+"|"+hash;
      res.cookie(session_id, hash);
      req.cookies[session_id] = hash;
    }

    var session_key = req.cookies[session_id];
    redis_cli.get(session_key, function(err, session_value) {
      if (!session_value) 
        req.session = {};
      else 
        req.session = JSON.parse(session_value);

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
