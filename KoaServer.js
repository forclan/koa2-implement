var Koa = require('./Koa');

var koa = new Koa();

async function defaultRouter(req, resp, next) {
    next();
    resp.end('no route match');
}

async function log(req, resp, next) {
    console.log(req.url);
    next();
}

async function testIndex(req, resp, next) {
    if (req.url === '/test') resp.end('match /test');
}

koa.use(defaultRouter);
koa.use(log);
koa.use(testIndex);

koa.listen(3000);