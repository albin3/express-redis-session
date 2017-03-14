//模拟实现express，避免在测试代码中引入Express
//Albin Zeng
//2015-06-05
var http = require('http');

function express() {
  //express的中间件,第一个函数为CookieParser功能
  var server = http.createServer();
  server.middleware = [cookieParser];

  //实现express的use功能
  server.use = function(f) {
    server.middleware.push(f);
  };

  //递归循环调用middleware
  server.helper = function(req, res, idx) {
    if (typeof server.middleware[idx] != 'undefined') {
      server.middleware[idx](req, res, function(err) {
        if (!err) {
          return server.helper(req, res, idx+1);
        } else {
          return res.write('middle error');
        }
      });
    }
  }

  server.on('request', function(req, res) {
    server.helper(req, res, 0);
  });
  return server;
};

//cookieParser通过分析headers解析为cookie
function cookieParser(req, res, next) {
  var headers = req.headers || {};
  var cookie = headers['cookie'] || '';
  var listCookies = cookie.split(';');

  var mapCookies = {};
  for (var i=0; i<listCookies.length; i++) {
    var idx = listCookies[i].indexOf('=');
    var key;
    var value;
    if (idx != -1) {
      key = listCookies[i].slice(0,idx).replace(/(^\s*)|(\s*$)/g,'');
      value = listCookies[i].slice(idx+1).replace(/(^\s*)|(\s*$)/g,'');
    } else {
      key = 'key';
      value = 'value';
    }
    mapCookies[key] = value;
  }
  req.cookies = mapCookies;

  res.cookie = function(key, value) {
    listCookies.push(key+'='+value);
    res.setHeader("Set-Cookie", listCookies);
  }

  next();
}

module.exports = express;
