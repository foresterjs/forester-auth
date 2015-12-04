"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.check = check;
exports.login = login;

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } step("next"); }); }; }

var jwt = require('jsonwebtoken');
var assert = require('assert');

module.exports = function (config) {

  assert(config.jwt, "jwt config not defined");
  assert(config.jwt.secret, "jwt.secret not defined");

  return function (forester) {

    var usersCollection = forester.registerCollection(require('./_users.json'));
    var tokensCollection = forester.registerCollection(require('./_tokens.json'));

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
};

function check(usersCollection, tokensCollection, config) {

  return (function () {
    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(ctx, next) {
      var request, response, token, vars, tokenObj, user;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              request = ctx.request;
              response = ctx.response;
              token = request.query.token || request.get('Authorization');

              if (token) {
                _context.next = 7;
                break;
              }

              _context.next = 6;
              return next();

            case 6:
              return _context.abrupt('return');

            case 7:
              _context.prev = 7;
              vars = jwt.verify(token, config.jwt.secret);
              _context.next = 15;
              break;

            case 11:
              _context.prev = 11;
              _context.t0 = _context['catch'](7);

              response.status = 403;
              return _context.abrupt('return');

            case 15:
              _context.next = 17;
              return tokensCollection.findAll({ where: { token: token } });

            case 17:
              tokenObj = _context.sent;

              if (!(tokenObj.length !== 1)) {
                _context.next = 21;
                break;
              }

              response.status = 403;
              return _context.abrupt('return');

            case 21:
              tokenObj = tokenObj[0];

              /*********
               pick user
               *********/
              response.body = response.body || {};
              _context.next = 25;
              return usersCollection.pick(tokenObj.userId);

            case 25:
              user = _context.sent;

              delete user.password;

              /***********
               authenticate
               ************/
              ctx.user = user; //If authenticated put user in ctx

              _context.next = 30;
              return next();

            case 30:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this, [[7, 11]]);
    }));

    return function (_x, _x2) {
      return ref.apply(this, arguments);
    };
  })();
}

function login(usersCollection, tokensCollection, config) {
  return (function () {
    var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(_ref, next) {
      var request = _ref.request;
      var response = _ref.response;

      var _request$body, username, password, users, user, data, token;

      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _request$body = request.body;
              username = _request$body.username;
              password = _request$body.password;

              response.body = response.body || {};

              /*********
               pick user
               *********/

              _context2.next = 6;
              return usersCollection.findAll({ where: { username: username } });

            case 6:
              users = _context2.sent;

              if (!(users.length !== 1)) {
                _context2.next = 13;
                break;
              }

              response.body.done = false;
              response.body.errors = ['not_found'];
              _context2.next = 12;
              return next();

            case 12:
              return _context2.abrupt('return');

            case 13:
              user = users[0];

              /***************
               check password
               **************/

              if (!(user.password !== password)) {
                _context2.next = 20;
                break;
              }

              response.body.done = false;
              response.body.errors = ['bad_password'];
              _context2.next = 19;
              return next();

            case 19:
              return _context2.abrupt('return');

            case 20:
              delete user.password;

              /*********************
               sign and create token
               *********************/
              data = {
                token: jwt.sign({}, config.jwt.secret),
                userId: user.id
              };
              _context2.next = 24;
              return tokensCollection.create(data);

            case 24:
              token = _context2.sent;

              response.body.data = token;
              response.body.user = user;
              response.body.done = true;

              _context2.next = 30;
              return next();

            case 30:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    return function (_x3, _x4) {
      return ref.apply(this, arguments);
    };
  })();
}
//# sourceMappingURL=index.js.map