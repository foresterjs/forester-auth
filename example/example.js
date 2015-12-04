"use strict";

var Forester = require('forester');
var foresterAuth = require('../lib');


var app = new Forester();

app.use(require('forester-explorer'));

app.use(foresterAuth({"jwt": {"secret": "change_me"}}));

app.registerCollection(require('./json/collections/authors.json'));
app.registerCollection(require('./json/collections/articles.json'));

app.registerDataSource(require('./json/db1.json'));
app.registerMappings(require('./json/mappings.json'));

app.boot()
  .then(() => {
    app.listen({port: 3000});
  })
  .catch((e) => {
    console.log(e.stack)
  });




