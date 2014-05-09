/* DB and sessions */
var cql = require('node-cassandra-cql');
var CasClient = cql.Client;
var client = new CasClient({ hosts: ['localhost'], keyspace: 'chive' });

/* Secret key to be used later */
var secret = require('../keyfile.js');

module.exports = {
  configure: function(app, express) {
    var CasStore = require('connect-cassandra-cql')(express),
    config = { client: client };
    app.use(express.cookieParser())
       .use(express.methodOverride())
       .use(express.json())
       .use(express.urlencoded())
       .use(express.session({
         secret: secret,
         key: 'sid',
         cookie: {
           secure: true
         },
         store: new CasStore(config)
       }));
  },
  client: client,
  cql: cql
};
