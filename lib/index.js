'use strict';

var redis  = require('ioredis');
var crypto = require('crypto');
var redis = require('ioredis');
var debug = require('debug')('index');

module.exports = nodeRedisSession;

/*
 @use: generate a express redis-session middleware
 @params: Object {
                   redisOptions: [port, host, options],
                   cookieName: xxx,
                   expireTime: 24*3600*1000
                }
*/
function nodeRedisSession(params) {
  var redisOptions = [];
  var cookieName = 'SESSIONID';
  var expireTime = 24*3600*1000; // default (ms)
  var redisClient;

  if (arguments.length > 0) {
    if (typeof params.redisOptions !== 'undefined') {
      redisOptions = params.redisOptions;
    }
    if (typeof params.cookieName !== 'undefined') {
      cookieName = params.cookieName;
    }
    if (typeof params.expireTime === 'number') {
      expireTime = params.expireTime;
    }
    if (typeof params.redisClient !== 'undefined') {
      redisClient = params.redisClient;
    }
  }

  if (!redisClient) {
    try {
      redisClient = redis.createClient.apply(redis, redisOptions);
    } catch(e) {
      throw 'error occurred when create redis client, please check redisOptions is corrent.';
    }
  }

  return function(req, res, next) {
    if (!req.hasOwnProperty('cookies')) {
      throw 'Please use app(cookieParser()); See README.md and add it.';
    }

    //no cookie set, add a new cookie.
    var sid;
    if(! Object.prototype.hasOwnProperty.call(req.cookies, cookieName)) { // true
      //easy to find in redis with command "keys * s|*"
      sid = 's|'+generateSid();
      req.cookies[cookieName] = sid;
      res.cookie(cookieName, sid, { expires: new Date(new Date().getTime()+expireTime), httpOnly: true });
    }

    //read session from redis when request comes.
    sid = req.cookies[cookieName];
    debug('cookieName: ', sid);
    redisClient.get(sid, function(err, sessionStr) {
      debug('sessionStr: ', sessionStr);
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

        if(!req.hasOwnProperty('session')) req.session = {};
        redisClient.set(sid, JSON.stringify(req.session));
        redisClient.expire(sid, expireTime/1000);
      };

      next();
    });

  };
}

//generate unique sid
function generateSid() {
  return crypto.createHash('md5')
               .update(new Date().getTime()+'_*$')
               .digest('hex') +
         crypto.randomBytes(8)
               .toString('base64')
               .replace(/\+/g, '0')
               .replace(/\//g, '0');
}

//old version
nodeRedisSession.get_redis_session = function() {
  var err = '    in this version use it like : \n'+
            '        "var redisSession = require("node-redis-session")\n'+
            '        app.use(redisSession())"\n'+
            '    SEE IN README.md of "node-redis-session"\n';
  throw err;
};
