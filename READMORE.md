node-redis-session
==========================
[![Build Status](https://travis-ci.org/albin3/express-redis-session.svg?branch=master)](https://travis-ci.org/albin3/express-redis-session)

## cookie-session简介

+ `Cookie`: HTTP是一种无状态协议，用Cookie来区分不同的客户端。在协议中通过headers里的`‘cookies’`、`‘set-cookie’`来设置和获取。
+ `Session`: 当客户的信息涉及到隐私，不能传递到客户端时，服务器端自己通过为每个用户开辟一个空间，存储这些隐私信息，而Express的Session直接存在内存里。

## Session存在内存里的问题

+ `状态丢失`: 重启服务器或宕机会导致状态丢失；
+ `状态依赖`: 导致同一个用户永远只能访问同一个服务，不然无法找到当前状态；

## Redis-Session解决方案的优势

+ `持久化`: Redis数据落盘保证宕机或重启服务器时能找回状态(可设置落盘频率调优)；
+ `服务状态独立`: 服务做到无状态运行，简单的堆机器可以解决用户量上升需求；
+ `过期控制`: 用redis自带的Expire，可以方便得设置过期节约内存使用；
+ `调试方便`: 从Redis Command Line中可以查询、备份状态；

## Express-Redis-Session设计

### Cookie-Session-Redis设计
1. 在客户端Cookie中存入新键值对: "cookieName=SessionId"；
2. 在Redis中，存入新的键值对作为Session: "SessionId: {username: anonymos, age: 18}"；

### Express-Middleware实现
1. 请求到达时，从Redis中取得Session并存入"req.session"，方便使用（用Middleware轻松实现）；
2. 请求结束时，将"req.session"存回到Redis，保持状态（查看文档，劫持res.end函数实现）；


## 扩展参数(实践中遇到的问题)

+ `redisOptions`: 配置Redis连接设置，保证连接到Redis；
+ `cookieName`: 由于Cookie只是域名绑定，端口不绑定，保证多项目同时使用这个库时，会导致CookieName冲突，使用这个参数配置不同的CookieName；
+ `expireTime`: Cookie/Session过期时间；

## 安装使用

[node-redis-session](https://github.com/albin3/express-redis-session)

## 感谢

参与思路的讨论与建议

- <img src="https://avatars2.githubusercontent.com/u/1445522?v=3&s=192"/ width="32"> [丁文森](/vincenting)
