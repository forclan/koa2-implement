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
`handleMiddleware`这个函数接受`request`,`response`作为参数,并要将通过`use`参数传入的函数逐个进行调用,所以一个很简单的想法就是使用一个数组来保存用户的输入,于是Koa的代码变成这样:
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

于是,我们有了这样的东西:数组this.functions,其中的每一项都是一个function
比如说this.functions = [func1, func2, func3];
// 为简便起见,我们规定`use`的函数接受3个参数,分别是request,reponse以及next。
async func1(request, response, next) {
    console.log((new Date).toString());
    var result = await next();
    console.log((new Date).toString());
}

然后现在的目的是完成这样一个函数,它将[func1, func2, func3]这个数组变成一个函数,这个函数在碰到funcN中的next时,会将执行交给funcN+1,当funcN+1执行完成后,继续funcN的执行。
由于使用的是数组,我们可以将这个函数数组包装起来,新建一个函数run(),run(0)执行func1,run(1)执行func依次类推。
于是将函数数组组合的代码如下:
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

运行代码如下:
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
async function multipleNextFunc(request, reponse, next) {
    console.log(request);
    next();
    next();
}
```
这里有两种办法,一种是在创建一个验证的函数,在函数输入的时候进行验证;另一种则是在函数运行的时候进行验证检测。
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

全部的代码可以参考目录下的`Koa.js`,也可以执行`node KoaServer.js`来在3000端口上运行样例,并访问`localhost:3000`与`localhost:3000/test`。