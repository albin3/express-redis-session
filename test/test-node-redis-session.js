//test case
var assert = require('assert');
var redisSession = require('../');
var express = require('./miniExpress');
var http = require('http');
var Redis = require('ioredis');

//用于比较两次返回的Session，prev为上次设置的Session，current为本次获得的Session
var prev = '';
var current = '';
var cookie;

describe('#nodeRedisSession', function() {
  //start server
  before(function(done) {
    var app = express();
    app.use(redisSession({ 
      redisOptions: [ 6379, 'localhost', {} ], 
      cookieName: 'sid#test', 
      expireTime: 24*3600*1000 
    }));

    app.use(function(req, res) {
      if (req.session) {
        res.write(JSON.stringify(req.session));
      }
      res.write(';');
      req.session = {
        randomSort: [1,2,3,4,5,6]
                    .sort(function() { 
                            if (Math.random()>0.5) return true
                          })
      };
      res.end(JSON.stringify(req.session));
    });

    app.listen(3009);

    setTimeout(function() {
      done();
    }, 300);
  });

  it('first request', function(done) {
    http.request({
      hostname: '127.0.0.1',
      port: 3009,
      path: '/',
      method: 'GET'
    }, function(res) {
      assert.equal(res.statusCode, 200);
      assert.equal(typeof res.headers['set-cookie'], 'object');
      var setCookie = res.headers['set-cookie'];
      cookie = '';
      for (var i=0; i<setCookie.length; i++) {
        cookie += setCookie[i]+';';
      }
      cookie = cookie.slice(0,-1);

      res.on('err', function(err) {
        done(err);
      });

      var data = '';
      res.on('data', function(chunk) {
        data += chunk.toString();
      });
      res.on('end', function() {
        prev = data.split(';')[1];
        assert(typeof prev, 'string');
        done();
      });
    }).end();
  });

  it('second request', function(done) {
    http.request({
      hostname: '127.0.0.1',
      port: 3009,
      path: '/',
      method: 'GET',
      headers: {
        cookie: cookie
      }
    }, function(res) {
      assert.equal(res.statusCode, 200);
      assert.equal(typeof res.headers['set-cookie'], 'undefined');

      res.on('err', function(err) {
        done(err);
      });

      var data = '';
      res.on('data', function(chunk) {
        data += chunk.toString();
      });
      res.on('end', function() {
        current = data.split(';')[0];
        assert.equal(prev, current);
        done();
      });
    }).end();
  });
});

describe('#redis client support', function() {
  before(function(done) {
    var app = express();
    app.use(redisSession({ 
      redisClient: new Redis(),
      cookieName: 'sid#test', 
      expireTime: 24*3600*1000 
    }));

    app.use(function(req, res) {
      if (req.session) {
        res.write(JSON.stringify(req.session));
      }
      res.write(';');
      req.session = {
        randomSort: [1,2,3,4,5,6]
                    .sort(function() {
                            if (Math.random()>0.5) return true
                          })
      };
      res.end(JSON.stringify(req.session));
    });

    app.listen(3012);

    setTimeout(function() {
      done();
    }, 300);
  });

  it('first request', function(done) {
    http.request({
      hostname: '127.0.0.1',
      port: 3012,
      path: '/',
      method: 'GET'
    }, function(res) {
      assert.equal(res.statusCode, 200);
      assert.equal(typeof res.headers['set-cookie'], 'object');
      var setCookie = res.headers['set-cookie'];

      cookie = '';
      for (var i=0; i<setCookie.length; i++) {
        cookie += setCookie[i]+';';
      }
      cookie = cookie.slice(0,-1);

      res.on('err', function(err) {
        done(err);
      });

      var data = '';
      res.on('data', function(chunk) {
        data += chunk.toString();
      });
      res.on('end', function() {
        prev = data.split(';')[1];
        assert(typeof prev, 'string');
        done();
      });
    }).end();
  });

  it('second request', function(done) {
    http.request({
      hostname: '127.0.0.1',
      port: 3012,
      path: '/',
      method: 'GET',
      headers: {
        cookie: cookie
      }
    }, function(res) {
      assert.equal(res.statusCode, 200);
      assert.equal(typeof res.headers['set-cookie'], 'undefined');

      res.on('err', function(err) {
        done(err);
      });

      var data = '';
      res.on('data', function(chunk) {
        data += chunk.toString();
      });
      res.on('end', function() {
        current = data.split(';')[0];
        assert.equal(prev, current);
        done();
      });
    }).end();
  });
});

describe('#sso && app cache support', function() {
  before(function(done) {
    var app = express();
    app.use(redisSession({ 
      redisClient: new Redis(),
      cookieName: 'sid#test',
      cacheCookieName: 'sid#cache',
      expireTime: 24*3600*1000 
    }));

    app.use(function(req, res) {
      if (req.cache) {
        res.write(JSON.stringify(req.cache));
      }
      res.write(';');
      req.cache = {
        randomSort: [1,2,3,4,5,6]
                    .sort(function() {
                            if (Math.random()>0.5) return true
                          })
      };
      res.end(JSON.stringify(req.cache));
    });

    app.listen(3015);

    setTimeout(function() {
      done();
    }, 300);
  });

  it('first request', function(done) {
    http.request({
      hostname: '127.0.0.1',
      port: 3015,
      path: '/',
      method: 'GET'
    }, function(res) {
      assert.equal(res.statusCode, 200);
      assert.equal(typeof res.headers['set-cookie'], 'object');
      var setCookie = res.headers['set-cookie'];
      cookie = '';
      for (var i=0; i<setCookie.length; i++) {
        cookie += setCookie[i]+';';
      }
      cookie = cookie.slice(0,-1);

      res.on('err', function(err) {
        done(err);
      });

      var data = '';
      res.on('data', function(chunk) {
        data += chunk.toString();
      });
      res.on('end', function() {
        prev = data.split(';')[1];
        assert(typeof prev, 'string');
        done();
      });
    }).end();
  });

  it('second request', function(done) {
    http.request({
      hostname: '127.0.0.1',
      port: 3015,
      path: '/',
      method: 'GET',
      headers: {
        cookie: cookie
      }
    }, function(res) {
      assert.equal(res.statusCode, 200);
      assert.equal(typeof res.headers['set-cookie'], 'undefined');

      res.on('err', function(err) {
        done(err);
      });

      var data = '';
      res.on('data', function(chunk) {
        data += chunk.toString();
      });
      res.on('end', function() {
        current = data.split(';')[0];
        assert.equal(prev, current);
        done();
      });
    }).end();
  });
});

describe('#getRedisClient support', function() {
  before(function(done) {
    var app = express();
    var redisClient = new Redis();
    function getRedisClient() {
      return redisClient;
    }
    app.use(redisSession({ 
      getRedisClient: getRedisClient,
      cookieName: 'sid#test',
      cacheCookieName: 'sid#cache',
      expireTime: 24*3600*1000 
    }));

    app.use(function(req, res) {
      if (req.cache) {
        res.write(JSON.stringify(req.cache));
      }
      res.write(';');
      req.cache = {
        randomSort: [1,2,3,4,5,6]
                    .sort(function() {
                            if (Math.random()>0.5) return true
                          })
      };
      res.end(JSON.stringify(req.cache));
    });

    app.listen(3018);

    setTimeout(function() {
      done();
    }, 300);
  });

  it('first request', function(done) {
    http.request({
      hostname: '127.0.0.1',
      port: 3018,
      path: '/',
      method: 'GET'
    }, function(res) {
      assert.equal(res.statusCode, 200);
      assert.equal(typeof res.headers['set-cookie'], 'object');
      var setCookie = res.headers['set-cookie'];
      cookie = '';
      for (var i=0; i<setCookie.length; i++) {
        cookie += setCookie[i]+';';
      }
      cookie = cookie.slice(0,-1);

      res.on('err', function(err) {
        done(err);
      });

      var data = '';
      res.on('data', function(chunk) {
        data += chunk.toString();
      });
      res.on('end', function() {
        prev = data.split(';')[1];
        assert(typeof prev, 'string');
        done();
      });
    }).end();
  });

  it('second request', function(done) {
    http.request({
      hostname: '127.0.0.1',
      port: 3018,
      path: '/',
      method: 'GET',
      headers: {
        cookie: cookie
      }
    }, function(res) {
      assert.equal(res.statusCode, 200);
      assert.equal(typeof res.headers['set-cookie'], 'undefined');

      res.on('err', function(err) {
        done(err);
      });

      var data = '';
      res.on('data', function(chunk) {
        data += chunk.toString();
      });
      res.on('end', function() {
        current = data.split(';')[0];
        assert.equal(prev, current);
        done();
      });
    }).end();
  });
});

