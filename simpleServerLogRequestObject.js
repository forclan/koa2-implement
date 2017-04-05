const http = require('http'); // 导入http库

// 对http请求进行处理的函数,会将请求的地址打印在console中并返回结果
function handleRequest(request, response) {
    console.log(request);
    response.end('服务器返回的结果永远是这句话');
}
const server = http.createServer(handleRequest);

const app = server.listen(3000);