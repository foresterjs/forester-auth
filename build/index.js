"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.check = check;
exports.login = login;

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } step("next"); }); }; }

const jwt = require('jsonwebtoken');
const assert = require('assert');

module.exports = function (forester) {

  var usersCollection = forester.registerCollection(require('./_users.json'));
  var tokensCollection = forester.registerCollection(require('./_tokens.json'));
  var config = forester.config;

  forester.koa.use(check(usersCollection, tokensCollection, config));

  forester.registerEndpoint({
    action: "login",
    collectionName: usersCollection.name,
    method: "post",
    route: "/login",
    middlewares: [login(usersCollection, tokensCollection, config)],
    description: "login and create a session token"
  });
};

function check(usersCollection, tokensCollection, config) {

  return (function () {
    var ref = _asyncToGenerator(function* (ctx, next) {

      assert(config.jwt, "jwt config not defined");
      assert(config.jwt.secret, "jwt secret not defined");

      var request = ctx.request;
      var response = ctx.response;

      var token = request.query.token || request.get('Authorization');
      if (!token) {
        yield next();
        return;
      }

      /********************
       check token with jwt
       *********************/
      try {
        var vars = jwt.verify(token, config.jwt.secret);
      } catch (e) {
        response.status = 403;
        return;
      }

      /**************************
       check token with storage
       **************************/
      var tokenObj = yield tokensCollection.findAll({ where: { token } });
      if (tokenObj.length !== 1) {
        response.status = 403;
        return;
      }
      tokenObj = tokenObj[0];

      /*********
       pick user
       *********/
      response.body = response.body || {};
      var user = yield usersCollection.pick(tokenObj.userId);
      delete user.password;

      /***********
       authenticate
       ************/
      ctx.user = user; //If authenticated put user in ctx

      yield next();
    });

    return function (_x, _x2) {
      return ref.apply(this, arguments);
    };
  })();
}

function login(usersCollection, tokensCollection, config) {
  return (function () {
    var ref = _asyncToGenerator(function* (_ref, next) {
      let request = _ref.request;
      let response = _ref.response;

      assert(config.jwt, "jwt config not defined");
      assert(config.jwt.secret, "jwt secret not defined");

      var _request$body = request.body;
      var username = _request$body.username;
      var password = _request$body.password;

      response.body = response.body || {};

      /*********
       pick user
       *********/

      var users = yield usersCollection.findAll({ where: { username: username } });

      if (users.length !== 1) {
        response.body.done = false;
        response.body.errors = ['not_found'];
        yield next();
        return;
      }
      var user = users[0];

      /***************
       check password
       **************/
      if (user.password !== password) {
        response.body.done = false;
        response.body.errors = ['bad_password'];
        yield next();
        return;
      }
      delete user.password;

      /*********************
       sign and create token
       *********************/
      var data = {
        token: jwt.sign({}, config.jwt.secret),
        userId: user.id
      };

      var token = yield tokensCollection.create(data);

      response.body.data = token;
      response.body.user = user;
      response.body.done = true;

      yield next();
    });

    return function (_x3, _x4) {
      return ref.apply(this, arguments);
    };
  })();
}
//# sourceMappingURL=index.js.map