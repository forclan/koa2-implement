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