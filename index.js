const express = require('express');
const app = express();
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStatergy = require('passport-local');

mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/sessionDB");

const { User } = require('./models/user');

appSession = session({
    secret: "jklsfncmdilfgjs;dofikcmksrdhynudfgvfjlkfshgk;",
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
});

app.use(appSession);
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

passport.use(new LocalStatergy(function (username, password, done) {
    // console.log(username);
    // console.log(password);
    User.findOne({ email: username }).then((user) => {
        if (user) {
            if (user.password === password) {
                done(null, user);
            }else{
                done(null,false);
            }
        }else{
            done(null,false);
        }
    }, () => {
        done(null, false);
    })
}));

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.redirect('/login');
}

app.get('/', (req, res) => {

    res.send('Success');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {
    var user = new User({
        userName: req.body.userName,
        email: req.body.email,
        password: req.body.password
    })

    user.save().then((user) => {
        res.redirect('/');
    });
});

app.get('/login', (req, res) => {
    res.render('login');
})

app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard',{
        user : req.user
    });
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/dashboard');
});

app.get('/logout',(req,res) => {
    req.logout();
    req.session.destroy();
    res.redirect('/login');
});

app.listen(3000);