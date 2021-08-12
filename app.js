//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const app = express();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

//Connect
mongoose.connect('mongodb://localhost:27017/userDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
//Create a schema and model
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

//model
const User = new mongoose.model('User', userSchema);

app.get('/', function (req, res) {
    res.render('home');
});
app.get('/login', function (req, res) {
    res.render('login');
});
app.get('/register', function (req, res) {
    res.render('register');
});
//Create a new user
app.post('/register', function (req, res) {

    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        const newUser = new User({
            email: req.body.username,
            password: hash
        });
        newUser.save(function (err) {
            if (err) {
                console.log(err);
            } else {
                res.render('secrets');
            }
        });
    });
});

// Check the log-in 
app.post('/login', function (req, res) {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({
        email: username,
        //password: password
    }, function (err, foundUser) {

        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                bcrypt.compare(password, foundUser.password, function (err, result) {
                    if (result === true) {
                        res.render('secrets');
                        console.log('Success!');
                    }
                });
            }  
        }
    });
});

app.listen(3000, console.log('Server started on port 3000'));