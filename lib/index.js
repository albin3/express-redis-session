//Author: Albin Zeng
//Date: 2015-06-05

var redis  = require('redis');
var crypto = require('crypto');
var redis = require('redis');

module.exports = nodeRedisSession;

//use: generate a express redis-session middleware
//params: Object { redisOptions: [port, host, options], cookieName: xxx, expireTime: 24*3600*1000 } 
function nodeRedisSession(params) {

  var redisOptions = [];
  var cookieName = 'sid#default';
  var expireTime = 24*3600*1000; //(ms)
  var redisClient;

  if (arguments.length > 0) {
    if (params.hasOwnProperty('redisOptions')) {
      redisOptions = params['redisOptions'];
    }
    if (params.hasOwnProperty('cookieName')) {
      cookieName = params['cookieName'];
    }
    if (params.hasOwnProperty('expireTime') && typeof expireTime == 'number') {
      expireTime = params['expireTime'];
    }
  }

  try {
    redisClient = redis.createClient.apply(redis, redisOptions);
  } catch(e) {
    throw 'error occurred when create redis client, please check redisOptions is corrent.';
  }

  return function(req, res, next) {

    if (!req.hasOwnProperty('cookies')) {
      throw 'Please use app(cookieParser()); See README.md and add it.';
    }

    //no cookie set, add a new cookie.
    var sid;
    if (!req.cookies.hasOwnProperty(cookieName)) {
      //easy to find in redis with command "keys * s|*"
      sid = 's|'+generateSid();
      req.cookies[cookieName] = sid;
      res.cookie(cookieName, sid, { expires: new Date(new Date().getTime()+expireTime), httpOnly: true });
    }

    //read session from redis when request comes.
    sid = req.cookies[cookieName];
    redisClient.get(sid, function(err, sessionStr) {

      try {
        if (!sessionStr) 
          req.session = {};
        else 
          req.session = JSON.parse(sessionStr);
      } catch (e) {
        console.log('Fail to get Session from redis');
      }

      //restore session when request is end. use a trigger to 'res.end'
      res._end = res.end;
      res.end = function() {

        res._end.apply(res, arguments);

        if(req.hasOwnProperty('session')) req.session = {};
        redisClient.set(sid, JSON.stringify(req.session));
        redisClient.expire(sid, expireTime/1000);

      }

      next();
    });

  }
}

//generate unique sid
function generateSid() {

  //md5(time+salt);
  return crypto.createHash('md5')
               .update(new Date().getTime()+'_*$')
               .digest('hex') +
         crypto.randomBytes(8)
               .toString('base64')
               .replace(/\+/g, '0')
               .replace(/\//g, '0');
}
