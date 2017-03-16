'use strict';

var redis  = require('ioredis');
var crypto = require('crypto');
var redis = require('ioredis');
var debug = require('debug')('index');

Object.assign = Object.assign || require('object.assign');

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
  var cacheCookieName;
  var expireTime = 8 * 3600 * 1000; // default (ms)
  var cookieOptions = {};
  var redisClient;
  var getRedisClient;

  if (arguments.length > 0) {
    if (typeof params.redisOptions !== 'undefined') {
      redisOptions = params.redisOptions;
    }
    if (typeof params.cookieName === 'string') {
      cookieName = params.cookieName;
    }
    if (typeof params.expireTime === 'number') {
      expireTime = params.expireTime;
    }
    if (typeof params.redisClient !== 'undefined') {
      redisClient = params.redisClient;
    }
    if (typeof params.cacheCookieName === 'string') {
      cacheCookieName = params.cacheCookieName;
    }
    if (typeof params.cookieOptions === 'object') {
      cookieOptions = params.cookieOptions;
      if (typeof cookieOptions.maxAge === 'number') {
        expireTime = cookieOptions.maxAge;
      }
    }
    if (typeof params.getRedisClient === 'function') {
      getRedisClient = params.getRedisClient;
    }
  }

  if (!redisClient && !getRedisClient) {
    try {
      redisClient = redis.createClient.apply(redis, redisOptions);
    } catch(e) {
      throw 'error occurred when create redis client, please check redisOptions is corrent.';
    }
  }

  return function(req, res, next) {
    if (getRedisClient) {
      redisClient = getRedisClient();
    }

    if (!req.hasOwnProperty('cookies')) {
      throw 'Please use app(cookieParser()); See README.md and add it.';
    }

    // if no cookie set, add a new cookie.
    var sid;
    var cacheSid;
    if (!Object.prototype.hasOwnProperty.call(req.cookies, cookieName)) { // true
      //easy to find in redis with command "keys * s|*"
      sid = 's|' + generateSid();
      req.cookies[cookieName] = sid;
      res.cookie(cookieName, sid, Object.assign({expires: new Date(new Date().getTime() + expireTime), httpOnly: true }, cookieOptions));
    }
    if (cacheCookieName && !Object.prototype.hasOwnProperty.call(req.cookies, cacheCookieName)) {
      cacheSid = 's|' + generateSid();
      req.cookies[cacheCookieName] = cacheSid;
      res.cookie(cacheCookieName, cacheSid, Object.assign({expires: new Date(new Date().getTime() + expireTime), httpOnly: true }, cookieOptions));
    }

    //read session from redis when request comes.
    sid = req.cookies[cookieName];
    if (cacheCookieName) {
      cacheSid = req.cookies[cacheCookieName];
    }
    debug('cookieName: ', sid);
    debug('cacheCookieName: ', cacheSid);

    var sessionNumber = 1;
    if (cacheCookieName) {
      sessionNumber += 1;
    }
    //restore session when request is end. use a trigger to 'res.end'
    function gotSessionCache() {
      sessionNumber--;
      if (sessionNumber === 0) {
        res._end = res.end;
        res.end = function() {
          res._end.apply(res, arguments);
       
          if (!req.hasOwnProperty('session')) req.session = {};
          redisClient.set(sid, JSON.stringify(req.session));
          redisClient.expire(sid, expireTime/1000);

          if (cacheCookieName) {
            if (!req.hasOwnProperty('cache')) req.cache = {};
            redisClient.set(cacheSid, JSON.stringify(req.cache));
            redisClient.expire(cacheSid, expireTime/1000);
          }
        };
       
        next();
      }
    }

    // get session from redis
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

      gotSessionCache();
    });

    // get cache from redis if cacheCookieName is set.
    if (cacheCookieName) {
      redisClient.get(cacheSid, function(err, sessionStr) {
        debug('sessionStr: ', sessionStr);
        try {
          if (!sessionStr)
            req.cache = {};
          else
            req.cache = JSON.parse(sessionStr);
        } catch (e) {
          console.log('Fail to get Cache from redis');
        }

        gotSessionCache();
      });
    }
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

