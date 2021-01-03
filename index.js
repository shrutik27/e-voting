const express = require('express');
const path = require('path');
const fs = require('fs');
const url = require('url');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const dbConnection = require('./js/database');
const bodyParser = require('body-parser');
const { text } = require("body-parser");
const  mv = require('mv');
var http = require('http')
	busboy = require("then-busboy"),
	fileUpload = require('express-fileupload'),
    mysql      = require('mysql');
var port= process.env.PORT || 8080;

const { body, validationResult } = require('express-validator');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({extended:false}));

// SET OUR VIEWS AND VIEW ENGINE
app.set('views', path.join(__dirname,'views'));
app.set('view engine','ejs');
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
// enable files upload
app.use(express.static(path.join(__dirname, 'fonts')));
//enables fonts access
app.use(fileUpload());

// APPLY COOKIE SESSION MIDDLEWARE
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
}));

// DECLARING CUSTOM MIDDLEWARE
const ifNotLoggedin = (req, res, next) => {
    if(!req.session.isLoggedIn){
        return res.render('login');
    }
    next();
}

const ifLoggedin = (req,res,next) => {
    if(req.session.isLoggedIn){
        return res.redirect('/home');
    }
    next();
}

// END OF CUSTOM MIDDLEWARE

app.get('/register', function(req, res) {
    res.render('register');
 });
 app.get('/login', function(req, res) {
    res.render('login');
 });



// REGISTER PAGE
app.post('/register', ifLoggedin, 
// post data validation(using express-validator)
[
    body('email','Invalid email address!').isEmail().custom((value) => {
        return dbConnection.execute('SELECT `email` FROM `users` WHERE `email`=?', [value])
        .then(([rows]) => {
            if(rows.length > 0){
                return Promise.reject('This E-mail already in use!');
            }
            return true;
        });
    }),
    body('name','Username is Empty!').trim().not().isEmpty(),
    body('pass','The password must be of minimum length 6 characters').trim().isLength({ min: 6 }),
],// end of post data validation
(req,res,next) => {

    const validation_result = validationResult(req);
    const {name, pass, email} = req.body;
    // IF validation_result HAS NO ERROR
    if(validation_result.isEmpty()){
        // password encryption (using bcryptjs)
        bcrypt.hash(pass, 12).then((hash_pass) => {
            // INSERTING USER INTO DATABASE
            dbConnection.execute("INSERT INTO `users`(`name`,`email`,`password`) VALUES(?,?,?)",[name,email, hash_pass])
            .then(result => {
                res.send(`your account has been created successfully, Now you can <a href="/">Login</a>`);
            }).catch(err => {
                // THROW INSERTING USER ERROR'S
                if (err) throw err;
            });
        })
        .catch(err => {
            // THROW HASING ERROR'S
            if (err) throw err;
        })
    }
    else{
        // COLLECT ALL THE VALIDATION ERRORS
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH VALIDATION ERRORS
        res.render('login',{
            register_error:allErrors,
            old_data:req.body
        });
    }
});// END OF REGISTER PAGE

// LOGIN PAGE
app.post('/', ifLoggedin, [
    body('email').custom((value) => {
        return dbConnection.execute('SELECT `email` FROM `users` WHERE `email`=?', [value])
        .then(([rows]) => {
            if(rows.length == 1){
                return true;
                
            }
            return Promise.reject('Invalid Email Address!');
            
        });
    }),
    body('pass','Password is empty!').trim().not().isEmpty(),
], (req, res) => {
    const validation_result = validationResult(req);
    const {pass, email} = req.body;
    if(validation_result.isEmpty()){
        
        dbConnection.execute("SELECT * FROM `users` WHERE `email`=?",[email])
        .then(([rows]) => {
            bcrypt.compare(pass, rows[0].password).then(compare_result => {
                if(compare_result === true){
                    req.session.isLoggedIn = true;
                    req.session.userID = rows[0].id;
                    req.session.user=rows[0].name;

                    res.redirect('/');
                }
                else{
                    res.render('login',{
                        login_errors:['Invalid Password!']
                    });
                }
            })
            .catch(err => {
                if (err) throw err;
            });

 
        }).catch(err => {
            if (err) throw err;
        });
    }
    else{
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH LOGIN VALIDATION ERRORS
        res.render('login',{
            login_errors:allErrors
        });
    }
});
// END OF LOGIN PAGE

// LOGOUT
app.get('/logout',(req,res)=>{
    //session destroy
    req.session = null;
    res.redirect('/');
});
// END OF LOGOUT

//START OF FORM
app.get('/',ifNotLoggedin, function(req, res) {
    res.render('home');
 });
app.get('/create',ifNotLoggedin, function(req, res) {
   res.render('create');
});

app.get('/home', function(req, res) {
    res.redirect('/');
 });
 app.get('/repo', ifNotLoggedin, (req,res,next) => {
    dbConnection.execute("SELECT * FROM repository ")
    .then(([result]) => {
        res.render('repo',{
            repo:result,
        });
    });   
});

app.post('/index',  (req, res) => {
       var post  = req.body;
       var username = req.session.userID;
       var course= post.course;
       var topic= post.topic;
       var description=post.description;
         var file = req.files.uploaded_image;
         var filename=Date.now()+file.name;
 
                                  
               file.mv('public/uploads/'+filename, function(err) {
                dbConnection.execute("INSERT INTO `repository`(`course`,`topic`,`filename`) VALUES(?,?,?)",[course, topic,filename])
                .then(result => {
                    res.send(`your record  has been created successfully, Now you can <a href="/">go home </a>`);
                }).catch(err => {
                    // THROW INSERTING USER ERROR'S
                    if (err) throw err;
                });

         });
});

    
    
app.use('/', (req,res) => {
    res.status(404).send('<h1>404 Page Not Found!</h1>');
});
app.listen(port, () => console.log("Server is Running at http://localhost:8080"));
