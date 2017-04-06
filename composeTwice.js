
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

var composedFunc1To3 = compose(arr);
var func4 = logHelpser('func4');
var arr2 = [composedFunc1To3, func4];
var composedFuncAll = compose(arr2);
composedFuncAll('request', 'response')