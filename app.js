//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const app = express();
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
// 2 - set-up a session
app.use(session({
    secret: 'PutLongStringHere',
    resave: false,
    saveUninitialized: true,
}));
// 3 - Initialize the session and use passport to manage the sessions
app.use(passport.initialize());
app.use(passport.session());

//Connect
mongoose.connect('mongodb://localhost:27017/userDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
mongoose.set('useCreateIndex', true);
//Create a schema and model
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        //  required: true
    },
    password: {
        type: String,
        // required: true
    },
    googleId: String
});

// 4 - add a localmongoose plugin to the schema
userSchema.plugin(passportLocalMongoose);
// Add findOrCreate plugin to the schema 
userSchema.plugin(findOrCreate);
//model
const User = new mongoose.model('User', userSchema);

// 5- use passport-local-mongoose to create a strategy
passport.use(User.createStrategy());
// 6 - serialize and deserialize our user.
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function(user, done){
    done(null, user);
});

passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: 'http://localhost:3000/auth/google/secrets',
        userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
    },
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        User.findOrCreate({
            googleId: profile.id
        }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get('/', function (req, res) {
    res.render('home');
});
app.get('/login', function (req, res) {
    res.render('login');
});
app.get('/register', function (req, res) {
    res.render('register');
});

// 8- create a secrets route to check if the user is authorized or not.
app.get('/secrets', function (req, res) {
    if (req.isAuthenticated()) {
        res.render('secrets');
    } else {
        res.redirect('/login');
    }
});

//log-out
app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

//google auth
app.get('/auth/google',
    passport.authenticate('google', {
        scope: ['profile']
    }));

//authentication callback
app.get('/auth/google/secrets',
    passport.authenticate('google', {
        failureRedirect: '/login'
    }),
    function (req, res) {
        res.redirect('/secrets');
    });
//Create a new user
app.post('/register', function (req, res) {
    // 7 - use register from passport-local-mongoose
    User.register({
        username: req.body.username
    }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect('/register');
        } else {
            passport.authenticate('local')(req, res, function () {
                res.redirect('/secrets');
            });
        }
    });
});

// Check the log-in 
app.post('/login', function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.logIn(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate('local')(req, res, function () {
                res.redirect('/secrets');
            });
        }
    });
});

app.listen(3000, console.log('Server started on port 3000'));