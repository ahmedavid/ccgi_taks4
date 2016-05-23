/*eslint-env node*/
var express     = require('express'),
    cfenv       = require('cfenv'),
    app         = express(),
    appEnv      = cfenv.getAppEnv(),
    bodyParser  = require('body-parser'),
    ejs         = require('ejs'),
    request     = require('request');

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');


var env = appEnv.services.cloudantNoSQLDB[0].credentials.url;
var db = 'task4db';

app.get('/',function (req, res) {
    request.get({
        url: env + "/"+db + "/_design/bears/_view/bears",
        headers: {
            'Content-Type': 'application/json'
        }}, function (error, response, body) {
        if ((error) || (!response.statusCode)) {
            console.log("ERROR: Can't get target db's docs." +error);
        }else if((response.statusCode < 300)) {
            var d = JSON.parse(body).rows;
            //res.json(d)
            res.render('home',{bears:d});
        }else {
            console.log("We have no error, but status code is not valid: "+response.statusCode);
        }
    });
});

app.get('/bear/:id',function (req, res) {
    var id = req.params.id;
    request.get({
        url: env + "/" + db + "/"+id,
        headers: {
            'Content-Type': 'application/json'
        }},
        function (error, response, body) {
        if ((error) || (!response.statusCode)) {
            console.log("ERROR: Can't get target db's docs." +error);
        }else if((response.statusCode < 300)) {
            var d = JSON.parse(body);
            res.render('bear_details',{bear:d});
        }else {
            console.log("We have no error, but status code is not valid: "+response.statusCode);
            res.render('notfound');
        }
    });
});

var rev = '';
//////DELETE BEAR//////
app.post('/bear/delete',function (req, res) {
    var id = req.body.id;    
    var rev = req.body.rev;    
    var url = env + "/"+db + "/"+id+"?rev="+rev;
    console.log("URL:"+url);
    request.delete({
        url: url,
        headers: {
            'Content-Type': 'application/json'
        }},
        function (error, response, body) {
            if ((error) || (!response.statusCode)) {
                console.log("ERROR: Can't get target db's docs." +error);
            }else if((response.statusCode < 300)) {
                res.redirect('/');
            }else {
                console.log("We have no error, but status code is not valid in delete: "+response.statusCode);
                res.send(body);
            }
        });
});

app.get('/add',function (req, res) {
    res.render('add');
});

app.post('/add',function (req, res) {
    var bear = {
        name:req.body.name,
        description:req.body.description,
        imgUrl:req.body.imgUrl,
        create_date:Date.now()
    }
    var json = JSON.parse(JSON.stringify(bear));
    request.post({
        url:env + "/" + db, json:json},
        function(err,httpResponse,body){
        if (err) {
            return console.error('upload failed:', err);
        }
        console.log('Upload successful!  Server responded with:', body);
    });
    res.redirect('/');
});

//EDIT AND UPDATE
app.get('/bear/edit/:id',function (req, res) {
    var id = req.params.id;
    request.get({
            url: env + "/"+db+"/"+id,
            headers: {
                'Content-Type': 'application/json'
            }},
        function (error, response, body) {
            if ((error) || (!response.statusCode)) {
                console.log("ERROR: Can't get target db's docs." +error);
            }else if((response.statusCode < 300)) {
                var d = JSON.parse(body);
                res.render('edit',{bear:d});
            }else {
                console.log("We have no error, but status code is not valid: "+response.statusCode);
                res.render('notfound');
            }
        });;
});

app.post('/bear/edit/',function (req, res) {
    var id= req.body.id;
    var rev = req.body.rev;

    if(req.body.name && req.body.description && req.body.imgUrl){
        var bear = {
            name:req.body.name,
            description:req.body.description,
            imgUrl:req.body.imgUrl,
            create_date:Date.now()
        }
    }else{
        res.redirect('/');
    }

    var json = JSON.parse(JSON.stringify(bear));
    request.put({
            url:env + "/"+db +"/"+id+"?rev="+rev, json:json},
        function(err,httpResponse,body){
            if (err) {
                return console.error('upload failed:', err);
            }
            console.log('Upload successful!  Server responded with:', body);
        });
    res.redirect('/');
});

app.get('/about',function (req, res) {
    res.render('about');
});

app.get('/:id',function (req, res) {
    res.render('notfound');
});


//start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
