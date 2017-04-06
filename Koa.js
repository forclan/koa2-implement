const http = require('http');

class Koa {
    constructor () {
        this.functions = [];
        return this;
    }
    use (fn) {
        if (typeof fn !== 'function') {
            throw Error('use的参数必须是函数');
        }
        this.functions.push(fn);
    }
    listen (port) {
        const composedFunc = this.getMiddleware(this.functions);
        function handleMiddleware (request, response) {
            return composedFunc(request, response);
        }
        const server = http.createServer(handleMiddleware);
        return server.listen(port);
    }
    getMiddleware (funcs) {
        return compose(this.functions);
    }
}

function compose (functionArray) {
    return function (request, response, next) {
        let hold = -1;

        function run (num) {
            if (num <= hold) {
                Promise.reject(new Error('函数多次调用'));
            }
            hold = num;
            let fn = functionArray[num];
            // 当一个函数数组执行完成后,执行一次next。
            if (num === functionArray.length) {
                fn = next;
            }
            // 完成时退出
            if (!fn) {
                return Promise.resolve();
            }
            return Promise.resolve(fn(request, response, function () {
                return run(num + 1);
            }));
        }
        return run(0);
    };
}

module.exports = Koa;