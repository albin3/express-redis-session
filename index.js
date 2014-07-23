var mongoose = require('mongoose'),
    swig = require('swig'),
    log4js = require('log4js'),
    _ = require('underscore'),
    path = require('path'),
    node_hash = require('node_hash'),
    helpers = require('./helpers');   // helper funcs
var redis  = require('redis');
var redis_session = redis.createClient();

var odm = exports.odm = {};
var tmpl_engine = exports.tmpl_engine = {};
var logger = exports.logger = {};

odm.init_app = function(app) {
  // mongoose
  function connect_db(db_uri) {
    var options = { server: { socketOptions: { keepAlive: 1 } } };
    mongoose.connect(db_uri, options);
  }

  connect_db(app.DB_URI);

  mongoose.connection.on('error', function(err) {
    if (app.DEBUG) {
      console.error(err.message.underline.red);
      console.error(err.stack);
    }
  });

  // 发生错误，数据库重连
  mongoose.connection.on('disconnected', function() {
    connect_db(app.DB_URI);
  });
  // End
};

tmpl_engine.init_app = function(app) {
  // swig
  app.engine('html', swig.renderFile);
  app.set('view engine', 'html');
  app.set('views', app.TEMPLATE_DIR);           // 视图文件夹
  app.set('view cache', !app.DEBUG);
  swig.setDefaults({ cache: false });           // debug模式下关闭视图缓存
  helpers.extend_swig_filters(swig);            // 添加视图filters
};

logger.init_app = function(app) {
  log4js.configure({
    appenders: [
      { type: 'console' },
      {
        type: 'file',
        filename: path.join(app.LOG_DIR, app.APP_NAME + '.log'),
        maxLogSize: app.LOG_MAX_SIZE,
        backups: app.LOG_BACKUPS,
        category: 'default'
      }
    ],
    replaceConsole: true
  });
  _.extend(logger, log4js.getLogger('default'));
};

exports.mysession = function(req, res, next) {    // 若不存在session-id 则新建一个作为在redis中的id
    // 1. 产生唯一session_id
    var session_id = 'session_id';
    if (!req.cookies[session_id]) {
      var time = new Date().getTime().toString();
      var salt = 'longyu'+Math.floor(Math.random()*100);
      var hash = node_hash.md5(time, salt);
      res.cookie(session_id, hash);
      req.cookies[session_id] = hash;
    }
    // 2. 请求到达时取出session值
    redis_session.hgetall(session_id, function(err, rst) {
      if (!rst) 
        req.session = {};
      else
        req.session = rst;
      // 3. 劫持res.end，在返回前更新session
      res._resend = res.end;
      res.end = function(params) {
        // 4. 调用真正的res.end函数
        res._resend(params);
        if(!req.session) req.session = {};
        var keys = Object.keys(req.session);
        if (keys.length) {
          for(var i=0; i<keys.length; i++)
            redis_session.hset(session_id, keys[i], req.session[keys[i]]);
          redis_session.expire(session_id, 30*60);
        }
      }
      next();
    });
  }
