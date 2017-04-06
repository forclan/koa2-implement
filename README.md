## 从零开始写一个Koa2

### Koa介绍
Koa的介绍可以参考这两个地址:
    - http://koajs.com/
    - http://javascript.ruanyifeng.com/nodejs/koa.html

### 创建httpServer的方式

#### nodejs需求
由于使用到了__await/async__,nodejs的版本需要大于`7.6.0`。
可以使用指令`node -v`来查看nodejs的版本。如果你使用的nodejs版本过低,可以使用`[nvm](https://github.com/creationix/nvm)`来安装符合要求的nodejs。

#### http.createServer介绍
`http`是nodejs中自带的一个库,其api可以参考[这里]()。我们使用`http.createServer`来生成一个服务,并在*3000*端口上进行监听,代码如下:
```js
// simpleServer.js
const http = require('http'); // 导入http库

// 对http请求进行处理的函数,会将请求的地址打印在console中并返回结果
function handleRequest(request, response) {
    console.log(request.url);
    console.log(request.httpVersion);
    response.end('服务器返回的结果永远是这句话');
}
const server = http.createServer(handleRequest);

const app = server.listen(3000);
```
执行`node simpleServer.js`启动服务就能在`http://localhost:3000`访问到页面了。你也可以访问`http://localhost:3000/test/`,`http://localhost:3000/any/path/you/want/`来访问。
现在介绍一下`handleRequest`函数。`http.createServer`接受一个函数作为参数。每当请求到达的时候,就会调用这个函数来进行处理。其中`request`是将用户的请求进行处理后的对象,如果将`console.log(request.url);`替换为`console.log(request);`就能看的整个请求了。一个样例如下:
```
     // request的部分数据
     on: [Function: socketOnWrap],
     _paused: false,
     read: [Function],
     _consuming: true,
     _httpMessage:
      ServerResponse {
        domain: null,
        _events: [Object],
        _eventsCount: 1,
        _maxListeners: undefined,
        output: [],
        outputEncodings: [],
        outputCallbacks: [],
        outputSize: 0,
        writable: true,
        _last: false,
        upgrading: false,
        chunkedEncoding: false,
```
`request`这个对象本身很大,常用的接口可以从[这里](https://nodejs.org/api/http.html#http_class_http_incomingmessage)查到。比较常用的有`heads,method,statusCode,url`等。
通过这些属性你就能判断用户请求的数据了并根据请求进行相应的处理了,甚至可以实现一个简单的路由。

包含路由代码如下:
```js
// simpleServerWithRouter.js
const http = require('http'); // 导入http库

// 对http请求进行处理的函数,会将请求的地址打印在console中并返回结果
function handleRequest(request, response) {
    const url = request.url;
    if (url === '/') {
        response.end('你请求的是根目录');
    } else if (url === '/test/') {
        response.end('你请求的是/test/目录');
    } else {
        response.end('请求的是其他目录');
    }
}
const server = http.createServer(handleRequest);

const app = server.listen(3000);
```
此时请求`localost:3000`与`localhost:3000/test/`会得到不同的返回结果。你也可以在这个基础上更进一步,使用正则表达式来实现复杂的路由匹配。


既然`request`表示用户的请求,那你肯定猜到`response`表示你回复客户端的数据了。`response`的API与`response`类似,你可以在[这里](https://nodejs.org/api/http.html#http_class_http_serverresponse)查看。之前的代码都使用`response.end(string)`来返回结果,你可以查看`http.ServerResponse`来设置更加复杂的返回值。

至此,最复杂的一步弄完了。我们发现通过`http.createServer`这个函数可以很方便的创建服务,但直接使用这个函数进行开发比较麻烦,下一步就是模仿Koa对其进行封装,最终实现一个拓展性强的后台框架。

参考资料:
    - https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/


## 动手实现Koa
之前已经介绍了Koa的基本概念已经如何创建一个httpServer,现在介绍如何实现简单的Koa。
首先实现Koa的基本结构,包括一个构造函数,`use`与`listen`两个方法。
```js
const http = require('http');
class Koa {
    construction() {
    }
    use (fn) {
    }
    listen (port) {
    }
}
```
Koa中的listen方法通过调用`http.createServer`返回一个结果。所以`listen`可以修改成这样:
```js
listen (port) {
    const server = http.createServer(handleMiddleware);
    return server.listen(port);
}
```
代码中的`handleMiddleware`是对http请求(request)与返回值(response)进行处理的函数。那么`Koa.use`能够对这个函数进行修改,也即添加新的处理函数。
`handleMiddleware`这个函数接受`request`,`response`作为参数,并要将通过`use`参数传入的函数逐个进行调用,所以一个很简单的想法就是使用一个数组来保存通过`use`传入的函数,于是Koa的代码变成这样:
```js
const http = require('http');
class Koa {
    construction() {
        this.functions = [];
    }
    use (fn) {
        if (typeof fn !== 'function') {
            throw Error('use的参数必须是函数');
        }
        this.functions.push(fn);
    }
    listen (port) {
        const handleMiddleware = getMiddleware(this.functions);
        const server = http.createServer(handleMiddleware);
        return server.listen(port)
    }
    getMiddleware(funcs) {
        return function(request, response) {
        }
    }
}
```

现在的问题就是在getMiddleware中实现这个功能:对`this.functions`中的各个函数逐个进行调用,并将结果返回。

于是,我们现在回顾已有的数据:数组this.functions,其中的每一项都是一个function
比如说this.functions = [func1, func2, func3];
// 为简便起见,我们规定`use`的函数接受3个参数,分别是request,reponse以及next。
async func1(request, response, next) {
    console.log((new Date).toString());
    var result = await next();
    console.log((new Date).toString());
}

现在的目的是完成这样一个函数,它将[func1, func2, func3]这个数组变成一个函数,这个函数在碰到funcN中的next时,会将执行交给funcN+1,当funcN+1执行完成后,继续funcN的执行。
由于使用的是数组,我们可以将这个函数数组包装起来,新建一个函数run(),run(0)执行func1,run(1)执行func依次类推。
第一次实现的函数的代码如下(不考虑Promise等):
```js
function compose(functionArray) {
    return function (request, response, next) {
        function run(num) {
            // 完成时退出
            if (!functionArray[num]) return;
            return functionArray[num](request, response, function() {
                return run(num + 1);
            });
        }
        return run(0);
    }
}
```

测试代码如下:
```js
// composeTest.js
function compose (functionArray) {
    return function (request, response, next) {
        function run (num) {
            // 完成时退出
            if (!functionArray[num]) return;
            return functionArray[num](request, response, function () {
                return run(num + 1);
            });
        }
        return run(0);
    };
}

function logHelpser (str) {
    return function (request, response, next) {
        console.log(str + 'in;' + 'request: is' + request);
        next();
        console.log(str + 'out;' + ';response:' + response);
    };
}

var arr = [logHelpser('func1'), logHelpser('func2'), logHelpser('func3')]

var composeFunc = compose(arr);

composeFunc('request', 'response');
```
使用`node composeTest.js`执行的结果是:
```
func1inrequest:request
func2inrequest:request
func3inrequest:request
func3out;response:response
func2out;response:response
func1out;response:response
```

这样compose函数就实现了将函数数组以插入的形式依次执行。同时我们希望`compose`函数返回的结果仍然可以继续进行组合。
```js
var arr = [logHelpser('func1'), logHelpser('func2'), logHelpser('func3')]
var func4 = logHelpser('func4');
var composedFunc1 = compose(arr);
var arr2 = [composedFunc1, func4];
var composedFuncAll = compose(arr2);
composedFuncAll('request', 'response');
```
但结果仍然是
```
func1inrequest:request
func2inrequest:request
func3inrequest:request
func3out;response:response
func2out;response:response
func1out;response:response
```
原因在于当composedFunc1执行完成后,我们没有手动的执行next,所以需要加上判断:
```js
// 修改后的函数
function compose (functionArray) {
    return function (request, response, next) {
        function run (num) {
            let fn = functionArray[num];
            // 当一个函数数组执行完成后,执行一次next。
            if (num === functionArray.length) {
                fn = next;
            }
            // 完成时退出
            if (!fn) return;
            return fn(request, response, function () {
                return run(num + 1);
            });
        }
        return run(0);
    };
}
```

如果用户传入的函数是这样,包含多个next要怎么解决?
```js
// 用户错误的输入函数
async function multipleNextFunc(request, reponse, next) {
    console.log(request);
    next();
    next();
}
```
这里有两种办法。一种是在创建一个验证的函数,在函数输入的时候进行验证;另一种则是在函数运行的时候进行验证检测。
首先是第一种方法:
```js
function isFuncHaveMultipleNext(fn) {
    let nextCount = 0;
    function next() {
        nextCount += 1;
    }
    fn({}, {}, next);
    if (nextCount <= 1) {
        return true;
    } else {
        return false;
    }
}
```
这个函数有这样几个问题:
    - 运行fn时如果fn使用console.log,会在终端输出信息
    - 如果fn需要访问request,response的属性可能报错

第二种方法在运行的时候进行检测,就不用担心碰到以上的那些问题了。思路类似,也是使用一个计数器来判断函数中next被调用了多少次。我们知道,每次调用next都会使run函数的参数加1。所以每次在调用run函数时检测参数num与上次调用时是否不匹配就能判断是否在同一个函数内多次调用next函数。
```js
function compose (functionArray) {
    return function (request, response, next) {
        let hold = -1;
        function run (num) {
            if (num <= hold) {
                throw Error('函数多次调用next');
            }
            hold = num;
            let fn = functionArray[num];
            // 当一个函数数组执行完成后,执行一次next。
            if (num === functionArray.length) {
                fn = next;
            }
            // 完成时退出
            if (!fn) return;
            return fn(request, response, function () {
                return run(num + 1);
            });
        }
        return run(0);
    };
}
```

最后,由于传入的函数是异步函数(包含async),并通过await获得异步调用返回的结果。所以需要将run函数返回的结果使用Prommise包裹起来,于是得到最终的代码:
```js
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
            if (!fn) return Promise.resolve();
            return Promise.resolve(fn(request, response, function () {
                return run(num + 1);
            }));
        }
        return run(0);
    };
}
```

Koa实现的compose函数代码如下,代码在[github地址](https://github.com/koajs/compose):
```js
'use strict'

const Promise = require('any-promise')

/**
 * Expose compositor.
 */

module.exports = compose

/**
 * Compose `middleware` returning
 * a fully valid middleware comprised
 * of all those which are passed.
 *
 * @param {Array} middleware
 * @return {Function}
 * @api public
 */

function compose (middleware) {
  if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!')
  for (const fn of middleware) {
    if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!')
  }

  /**
   * @param {Object} context
   * @return {Promise}
   * @api public
   */

  return function (context, next) {
    // last called middleware #
    let index = -1
    return dispatch(0)
    function dispatch (i) {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'))
      index = i
      let fn = middleware[i]
      if (i === middleware.length) fn = next
      if (!fn) return Promise.resolve()
      try {
        return Promise.resolve(fn(context, function next () {
          return dispatch(i + 1)
        }))
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}
```

最后Koa的代码如下:
```js
// Koa.js
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
```

全部的代码可以参考目录下的`Koa.js`,也可以执行`node KoaServer.js`在3000端口上运行示例,并访问`localhost:3000`与`localhost:3000/test`查看结果。