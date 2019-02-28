# fib-app-cli

## Document
Refer to [here](./doc/README-cn.md) to look up Chinese document.
## Brief introduction
The client to generate web application based on fib-app

## Usage
```
npm install -g fib-app-cli
fib-app-cli
cd $projectDir
npm install
npm test
```

## Development
The project is based on [fib-app](https://github.com/fibjs/fib-app.git), you could read the document before reading this.

### entry
The entry of the program is in file index.js under directory "entry", it created a sandbox and load the file app.js as the server handler. In app.js, session service is setuped and routing are defined.

### session service
The session service is based on [fib-session](https://github.com/fibjs/fib-session.git). It was placed in the first place in [mq.Chain](http://fibjs.org/docs/manual/object/ifs/chain.md.html) which meant that before handled by router [handlers](http://fibjs.org/docs/manual/object/ifs/routing.md.html) all requests had been checked by the session service . The service checked the validity of "sessionid" carried in cookies and would fetch session data of the sessionid and put the data in the request object as the so-called "session" if the sessionid was valid. You should use the session to identify the user of the requests in your application. Usaully, the sessionid in the cookie would be changed each time if there was nothing in the database or memory that related to the sessionid. However you could make the sessionid persistent by putting any data for example, `req.session.username = Kohl` to the "session" of the request object after the user called some methods like "login" correctly.

### routing
There is mainly one routing starting with path "/v1", and the handler is a fib-app instance which actually is an instance of [mq.Router](http://fibjs.org/docs/manual/object/ifs/routing.md.html). You could refer to the document to have knowledge of how the mq.Router works. Actually if you have known [express](https://expressjs.com/) you will know that the fib-app supports "express style" routing.

The fib-app instance contains all the capability of handling requests from clients, for example, to create an item, to lookup exact items, to modify or delete one item and many other functions.

### models
The item mentioned above is an instance of model which is defined in directory "_defs" under root directory "app". The "model" is what the table in database looks like in language layer, it is defined by [ORM](https://github.com/fxjs-modules/orm.git). ORM offers abundant methods to access and modify the tables in database. It works well with the ACL of fib-app which makes it convenient and safe when we define models.
              
In our initial project, the file named "user.js" shows how to use fib-app to define a model, write appropriate ACL and offer functions. It constructed an user system, upon logged in it initialize user session with two keys "id" and "roles" the value of which are the userid and roles of the user.

### ACL
ACL (access control layer) is very important in fib-app, almost all your operation involved with model should go through ACL.

"id" and "roles" in session of request are the two ways which ACL uses to identify the authority. 

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

The ACL config above demonstrate how to define useful ACL in scene below: should the app has a multi-role system, one user may have more than one role each of which has different access permission of some models. The right authority of the user should be an union of the access permission of the roles that the user has. To achieve this, you'd better follow sevral steps below:

- Put names of functions of the model in top entry `'*'` such as `'signup': true`, the functions can be invoked by request that has no "id" or "roles" in session.
- Put `'*': false` in top entry `'*'` just like the note A above, this prohibits all actions by requests which only carry "id" in session except the functions mentioned above .
- Only put value `true` of actions in roles, The user can not do any other actions not mentioned in his roles

### functions
In complex situations, for example, someone may want to signup when there are no users and roles, he would be denied by the model ACL if he simply calls the RESTful api that the model offered because he has no "role" or "id" in his user session. One good way is to define functions that can be invoked with no authority and put the names of the functions in the ACL just like the first suggestion in last section, and put your logic in these functions. In addtion you may need setup the session of the user requests in some function like "login".

If you need search or modify data in database, first you need fetch fib-app instance in your function for example, `const app = AppPlugins.AppStore.getApp()`, then you could do some database operations with the native API of fib-app. For example:
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

Refer to [native methods: app.api.*](https://github.com/fibjs/fib-app/blob/master/docs/app-internal-api.md#appapi) for more details.

Imagine that the concept of model is the same as which of "class" in language c++/java, and the instance of model is the same as the object of class. Method "post" is same as the key word "new". Method "put" is same as a method of class which could modify the member of an object. Method "del" is same as the key word "delete", and the method "find" is an extra method that can list all objects of the class.

The first param of thes native APIs is a wrapper of request object, you can retrive user sessoin from the request object by `req.session`. If you need authority in your functions when there are no users and roles, you'd better make a fake request object and put a role which had been declared in the model ACL in `req.session` for example, 
```
const fakeReq = {
    session: {
        id: null,
        roles: ['internal']
    },
    query: {}
}
```
and then pass the fake request object to the native APIs, make sure the role "internal" has been declared `'*': true` in the entry "roles" of model ACL.

### storage
Another routing starting with path "/storage" demonstrate how to use fib-app instance outside the files under direcotry "_defs". This routing serves as a file upload server.

### other capabilities
There have several other routing which supply other functionalities in file "entry/app.js". The router starting with path "/api/v1" allow you to invoke RESTful APIs that offered by fib-app as open APIs. That is to say, you could write a script to call these functions and APIs. A filter handler function will be defined and passed to mq.Chain to check the validity of http header "Api-Token" in your request before your request being handled.

The routing named "*" is a file handler. It handles all file downloading requests from the webside.