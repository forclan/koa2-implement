# 从0开始实现一个简单的Koa

## nodejs需求
由于使用到了__await/async__,nodejs的版本需要大于`7.6.0`。
可以使用指令`node -v`来查看nodejs的版本。如果你使用的nodejs版本过低,可以使用`[nvm](https://github.com/creationix/nvm)`来安装符合要求的nodejs。

### http.createServer介绍
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