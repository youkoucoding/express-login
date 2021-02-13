const express = require('express');
const path = require('path');
const app = express();
const passport = require('passport');
const mysql = require('mysql');
const flash = require('express-flash');
const session = require('express-session');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');

app.set('view-engine', 'ejs');
//publicDirectory
const publicDirectory = path.join(__dirname, './public/styles');
app.use(express.static(publicDirectory));

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: './.env' });
}

//database
const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE
});

db.connect((error) => {
  if (error) {
    console.log(error);
  } else {
    console.log('mysql is connected...');
  }
});

// authentication middleware
const initializePassport = require('./passport-config');
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
);

const users = [];

//middleware &parses incoming requests with urlencoded payloads and is based on body-parser.（as sent by HTML forms）
//This middleware is available in Express v4.16.0 onwards.  (bodyParser are old version)
app.use(express.urlencoded({ extended: false }));

app.use(flash());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

app.use('/public', express.static(__dirname + '/public'));

app.get('/', checkAuthenticated, (req, res) => {
  res.render('index.ejs', { name: req.user.name });
});

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs');
});

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs');
});

app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const hashedPasswordConfirm = await bcrypt.hash(req.body.passport, 10);
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      passwordConfirm: hashedPasswordConfirm
    });
    // databases email check
    db.query('SELECT email from users WHERE email = ?', (error, results) => {
      if (error) {
        console.log(error);
      }
      if (results.length > 0) {
        return res.render('register', {
          message: "This email is already in use"
        });
      } else if (hashedPassword !== hashedPasswordConfirm) {
        return res.render('register', {
          message: 'Password do not match'
        });

      }
    });
    res.redirect('/login');
  } catch (error) {
    res.redirect('/register');
  }
  console.log(users);
});

app.delete('/logout', (req, res) => {
  req.logOut();
  res.redirect('/login');
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  next();
}

app.listen(3000);