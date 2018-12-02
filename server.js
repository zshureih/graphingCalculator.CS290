var path = require('path');
var express = require('express');
var exphbs = require('express-handlebars');
var app = express();
//var postData = require('./postData.json');
var port = process.env.PORT || 3000;


app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.use(express.static('public'));

app.get('/', function (req, res, next) {
    res.status(200).render('canvas');
});

app.get('/posts/:n', function (req, res, next) {
    var n = req.params.n;
    if (n <= 7 && n >= 0) {
        var singlePost = postData.allPosts[n];
        console.log(singlePost);
        res.status(200).render('posts', singlePost);
    } else {
        next();
    }
});

app.get('*', function (req, res) {
    //res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
    res.status(404).render('404', {});
});

app.listen(port, function (err) {
    if (err) {
        throw err;
    }
    console.log("== Server is listening on port", port);
});
