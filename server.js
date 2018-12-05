var path = require('path');
var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');

var MongoClient = require('mongodb').MongoClient;

var mongoHost = process.env.MONGO_HOST;
var mongoPort = process.env.MONGO_PORT || 27017;
var mongoUsername = process.env.MONGO_USER;
var mongoPassword = process.env.MONGO_PASSWORD;
var mongoDBName = process.env.MONGO_DB_NAME;
var mongoURL = "mongodb://" + mongoUsername + ":" + mongoPassword + "@" + mongoHost + ":" + mongoPort + "/" + mongoDBName;
var mongoDB = null;
var app = express();
//var postData = require('./postData.json');
var port = process.env.PORT || 3007;
console.log(mongoURL);


app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res, next) {
    var equationsCollection = mongoDB.collection('equations');
    if(this) {
        res.status(200).render('canvas', equationsCollection);
    } else {
        next();
    }
});

app.get('/equations', function(req,res,next) {
  var equationsCollection = mongoDB.collection('equations');
  equationsCollection.find({}).toArray(function(err,equationsDocs) {
    if (err) {
      res.status(500).send("Error connecting to the DB");
    }
    console.log("here eq");
    res.status(200).render('canvas', {
      equations: equationsDocs
    });
  });
});

app.get('/equations/:n', function (req, res, next) {
    var func = req.params.func;
    var equationsCollection = mongoDB.collection('equations');
    equationsCollection.find({equationNamess: func}).toArray(function(err,equationsDocs) {
      if (err) {
        console.log("here n");
        res.status(500).send("Error connecting to the DB.");
      }
      else if (equationsDocs.length > 0) {
        console.log(func);
        console.log(equationsDocs[0].func);
        res.status(200).render('canvas',equationsDocs[0]);
      }
      else {
        next();
      }
    });

});

app.get('*', function (req, res) {
    //res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
    res.status(404).render('404', {});
});
/*
app.listen(port, function () {
  console.log("== Server listening on port", port);
});
*/

MongoClient.connect(mongoURL, function (err, client) {
  if (err) {
    throw err;
  }
  mongoDB = client.db(mongoDBName);
  app.listen(port, function () {
    console.log("== Server listening on port", port);
  });
});
