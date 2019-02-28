# fib-app-cli

## 文档
请参阅[此处](../README.md)以查看英文文档。

## 简介
一个于fib-app 生成 Web 应用程序的客户端基

## 用法
```
npm install -g fib-app-cli
fib-app-cli
cd $projectDir
npm install
npm test
```

## 开发
该项目基于 [fib-app](https://github.com/fibjs/fib-app.git)，您可以在阅读之前阅读该文档。

### 条目
程序的条目位于目录 "entry" 下的文件 index.js 中，它创建了一个沙箱并将文件app.js加载为服务器处理程序。在app.js中， session 服务已设置并定义了路由。

###  session 服务
 session 服务基于[fib-session](https://github.com/fibjs/fib-session.git)。它被置于 [mq.Chain](http://fibjs.org/docs/manual/object/ifs/chain.md.html) 的第一位，这意味着在由路由器 [handlers](http://fibjs.org/docs/manual/object/ifs/routing.md.html) 处理之前 session 服务已检查所有请求。该服务检查了 cookie 中携带的 `sessionid` 的有效性，并且如果 sessionid 有效，则将获取 sessionid 的 session 数据并将数据放入请求对象中。您应该使用该 session 来识别应用程序中的请求用户。通常，如果数据库或内存中没有与 sessionid 相关的内容，则每次都会更改 cookie 中的 sessionid。但是，在用户正确调用某些方法（如"login"）之后，您可以通过将任何数据（例如，`req.session.username = Kohl`）放入请求对象的 `session` 来使 sessionid 持久化。

### 路由
主要有一个路由以路径"/v1"开头，处理程序是一个 fib-app 实例，它实际上是 [mq.Router](http://fibjs.org/docs/manual/object/ifs/routing.md.html) 的一个实例。您可以参考该文档以了解 mq.Router 的工作原理。实际上，如果您已经知道 [express](https://expressjs.com/)，您就会知道 fib-app 支持 "express style" 的路由。

fib-app实例包含处理来自客户端的请求的所有功能，例如，创建条目，查找确切条目，修改或删除一个条目以及许多其他功能。

###  model
上面提到的条目是 model 的实例，它在根目录 "app" 下的目录 "_defs" 中定义。 model 是数据库中的表在语言层中的样子，它由 [ORM](https://github.com/fxjs-modules/orm.git) 定义。 ORM 提供了丰富的方法来访问和修改数据库中的表。它很好地配合 fib-app 的 ACL 工作，这使我们在定义 model 时更方便，更安全。

在我们的初始项目中，名为 "user.js" 的文件显示了如何使用 fib-app 定义 model ，编写适当的 ACL 和提供函数。它构建了一个用户系统，在登录后，用两个键 "id" 和 "roles" 初始化用户 session ，其中的值是用户 id 和用户角色。

### ACL
ACL（访问控制层）在fib-app中非常重要，几乎所有涉及 model 的操作都应该通过ACL。

请求 session 中的 "id" 和 "roles" 是ACL用于标识权限的两种方式。

```
ACL: function(session) {
    {
        '*': {
            'sync': true,
            'signup': true,
            'login': true,
            '*': false  // A
        },
        roles: {
            'normal': {
                'chpass': true,
                'logout': true
            },
            'internal': {
                '*': true,
                'extends': {
                    '*': {
                        '*': true
                    }
                }
            },
            'superadmin': {
                '*': true,
                'extends': {
                    '*': {
                        '*': true
                    }
                }
            }
        }
    }
}
```
上面的 ACL 配置演示了如何在下面的场景中定义有用的 ACL：如果应用程序具有多角色系统，则一个用户可能具有多个角色，每个角色具有某些 model 的不同访问权限。用户的正确权限应该是用户拥有的角色的访问权限的联合。要实现这一目标，您最好遵循以下几个步骤：

 - 将 model 函数的名称放在顶部条目 `"*"` 中，例如 `'signup'：true`，函数可以通过 session 中没有"id"或"roles"的请求调用。
 - 在顶部条目 `"*"` 中放置 `'*'：false`，就像上面的注释A一样，这禁止了除了上面提到的函数之外只在 session 中携带"id"的请求的所有动作。
 - 只在角色中设置值'true`，用户不能执行其角色中未提及的任何其他操作

### function
例如，在复杂的情况下，有人可能想要在没有用户和角色时注册，如果他只是调用 model 提供的 RESTful api，他就会被 model  ACL 拒绝，因为他没有 "role" 或 "id" 在他的用户 session 中。一个好的方法是定义可以在没有权限的情况下调用的函数，并将函数的名称放在 ACL 中，就像上一节中的第一个建议一样，并将逻辑放在这些函数中。另外，您可能需要在某些功能（如"登录"）中设置用户请求的 session 。

如果您需要在数据库中搜索或修改数据，首先需要在函数中获取 fib-app 实例，例如`const app = AppPlugins.AppStore.getApp()`，然后您可以使用 fib-app 的内置 API 进行一些数据库操作。例如：
 - `app.api.find(req, db, cls)`
 - `app.api.get(req, db, cls, id)`
 - `app.api.post(req, db, cls, data)`
 - `app.api.put(req, db, cls, id, data)`
 - `app.api.del(req, db, cls, id)`
 - `app.api.efind(req, db, cls, id, extend)`
 - `app.api.eget(req, db, cls, id, extend, rid)`
 - `app.api.epost(req, db, cls, id, extend, data)`
 - `app.api.eput(req, db, cls, id, extend, rid, data)`
 - `app.api.edel(req, db, cls, id, extend, rid)`

有关更多详细信息，请参阅 [native methods：app.api.*](https://github.com/fibjs/fib-app/blob/master/docs/app-internal-api.md#appapi)。

想象一下， model 的概念与 c++/java 语言中的 "class" 相同，而 model 的实例与 class 的对象相同。方法 "post" 与关键字 "new" 相同。方法 "put" 与可以修改对象成员的类方法相同。方法 "del" 与关键字 "delete" 相同，方法 "find" 是可以列出该类的所有对象的额外方法。

内置 API 的第一个参数是请求对象的包装器，您可以通过 `req.session` 从请求对象中检索用户 sessoin。如果在没有用户和角色的情况下需要权限，那么最好制作一个假的请求对象，并将一个在 model ACL 中声明的角色放在 `req.session` 中，例如，
```
const fakeReq = {
     session: {
        id: null，
        roles: ['internal']
    },
    query: {}
}
```
然后将伪请求对象传递给内置 API，确保在 model ACL 的条目 "roles" 中将角色 "internal" 声明为 `'*'：true`。

### storage
另一个以路径 "/storage" 开头的路由演示了如何在目录 "_defs" 下的文件以外使用 fib-app 实例。 此路由用作文件上载服务器。

### 其他功能
还有其他几个路由在文件 "entry/app.js" 中提供其他功能。以路径 "/api/v1" 开头的路由器允许您调用由 fib-app 提供的 RESTful API作为开放 API。也就是说，您可以编写一个脚本来调用这些函数和API。将定义过滤器处理函数并将其传递给 mq.Chain，以在处理请求之前检查请求中http头 "Api-Token" 的有效性。

名为 "*" 的路由是文件处理程序。它处理来自网络的所有文件下载请求。