//test case
var assert = require('assert');
var redisSession = require('../');
var express = require('./miniExpress');
var http = require('http');

var app = express();
app.use(redisSession({ redisOptions: [6379, 'localhost', {}], cookieName: 'sid#test', expireTime: 24*3600*1000 }));
app.use(function(req, res) {
  if (req.session)
    res.write(JSON.stringify(req.session));
  res.write(';');
  req.session = {randomSort: [1,2,3,4,5,6].sort(function() {if (Math.random()>0.5) return true})};
  res.end(JSON.stringify(req.session));
});
app.listen(3009);

//用于比较两次返回的Session，prev为上次设置的Session，current为本次获得的Session
var prev = '';
var current = '';
var setCookie;

describe('#nodeRedisSession', function(){
  it('first request', function(firstDone) {
    http.request({
      hostname: 'localhost',
      port: 3009,
      path: '/',
      method: 'GET'
    }, function(res) {
      firstDone();
      describe('#getFirstResponse', function() {
        it('statusCode should be 200.', function() {
          assert.equal(res.statusCode, 200);
        })
        it('set-cookie should be in headers', function() {
          if (typeof res.headers['set-cookie'] == 'undefined') {
            throw 'no set-cookie in res.headers.';
          } else {
            setCookie = res.headers['set-cookie'];
          }
        })
      });
      res.on('data', function(chunk) {
        describe('#firstRequestGetData', function() {
          it('check prev', function() {
            var data = chunk.toString();
            prev = data.split(';')[1];
            assert(typeof prev, 'string');
            var cookie = '';
            for (var i=0; i<setCookie.length; i++) {
              cookie += setCookie[i]+';';
            }
            cookie = cookie.slice(0,-1);
            describe('#secondRequest', function() {
              http.request({
                hostname: 'localhost',
                port: 3009,
                path: '/',
                method: 'GET',
                headers: {
                  cookie: cookie
                }
              }, function(res) {
                describe('#secondRequestResponse', function() {
                  it('statusCode should 200', function() {
                    assert(res.statusCode, 200);
                  })
                  it('no set-cookie should appear', function() {
                    if (res.headers['set-cookie']) {
                      throw 'error';
                    }
                  })
                })
                res.on('data', function(chunk) {
                  var current = chunk.toString().split(';')[0];
                  describe('#response data check', function() {
                    it('prev session SHOULD EQUAL current session', function() {
                      assert(prev, current);
                    });
                  })
                })
              }).end();
              it('second request sent.', function(done) {
                this.timeout(500);
                setTimeout(done, 200);
              })
            })
          })
        })
      });
    }).end();
    it('500ms timeout', function(done) {
      this.timeout(500);
      setTimeout(done, 200);
    })
  })
})
