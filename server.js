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
var equationJSON = require('./equations.json');
var port = process.env.PORT || 3007;
console.log(mongoURL);


app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res, next) {
    var equationsCollection = mongoDB.collection('equations');
    equationsCollection.find().toArray(function (err, equationDocs) {
      if(err) {
        res.status(500).send("Error connecting to the DB");
      } else if(equationDocs.length > 0) {
        console.log(equationDocs);
        res.status(200).render('canvas', equationDocs);
      } else {
        next();
      }
    });
});

/*app.get('/equations', function(req,res,next) {
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
    var func = req.params.n;
    var equationsCollection = mongoDB.collection('equations');
    equationsCollection.find().toArray(function(err,equationsDocs) {
      if (err) {
        console.log("here n");
        res.status(500).send("Error connecting to the DB.");
      }
      else if (equationsDocs.length > 0) {
        console.log(func);
        console.log(equationsDocs[0].func);
        console.log(equationsDocs);
        res.status(200).render('canvas',equationsDocs[0]);
      }
      else {
        next();
      }
    });

});*/

app.get('*', function (req, res) {
    //res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
    res.status(404).render('404', {});
});
/*
app.listen(port, function () {
  console.log("== Server listening on port", port);
});
*/

/*app.post('/get-equations', function(req, res, next) {
  console.log('received post');
  if(req.body) {
    var equationsCollection = mongoDB.collection('equations');
    console.log(equationsCollection);
    equationsCollection.find().toArray(function (err, equations) {
      if(err) {
        res.status(500).send("Error communicating with DB");
      } else if (equations.length > 0) {
        console.log(equations);
        res.status(200).send("success", equations);
      } else {
        next();
      }
    });
  }
});*/

app.post('/push-equation', function (req, res, next) {
  console.log('received post');
  if(req.body && req.body.func) {
    var equationsCollection = mongoDB.collection('equations');
    equationsCollection.insertOne(
      {func: req.body.func},
      function (err, result) {
        if(err) {
          res.status(500).send("Error saving equation to DB");
        } else if(result){
          res.status(200).send("Success");
        } else {
          next();
        }
      }
    );
  } else {
    res.status(400).send("request needs a body with a function");
  }
});

MongoClient.connect(mongoURL, function (err, client) {
  if (err) {
    throw err;
  }
  mongoDB = client.db(mongoDBName);
  app.listen(port, function () {
    console.log("== Server listening on port", port);
  });
});
