//test case
var assert = require('assert');
var nodeRedisSession = require('../');
var express = require('./miniExpress');
var http = require('http');

var app = express();
app.use(nodeRedisSession.get_redis_session("default"));
app.use(function(req, res) {
  if (req.session)
    res.write(JSON.stringify(req.session));
  res.write(';');
  req.session = {randomSort: [1,2,3,4,5,6].sort(function() {if (Math.random()>0.5) return true})};
  res.end(JSON.stringify(req.session));
});
app.listen(3009);

describe('#nodeRedisSession', function(){

  //用于比较两次返回的Session，prev为上次设置的Session，current为本次获得的Session
  var prev = '';
  var current = '';
  var setCookie;

  describe('#first request', function() {
    http.request({
      hostname: 'localhost',
      port: 3009,
      path: '/',
      method: 'GET'
    }, function(res) {
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
          it('data should not null', function() {
            this.timeout(500);
            var data = chunk.toString();
            prev = data.split(';')[1];
          })
          it('check prev', function() {
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
                  describe('#response data check', function() {
                    var current = chunk.toString().split(';')[0];
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
