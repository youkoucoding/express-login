const express = require('express');
const ejs = require('ejs');
const app = express();
const bcrypt = require('bcrypt');

const users = [];

const loginController = require('./controllers/login');
const registerController = require('./controllers/register');

app.set('view-engine', 'ejs');
//middleware &parses incoming requests with urlencoded payloads and is based on body-parser.
app.use(express.urlencoded({ extended: false }));

app.use('/public', express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', loginController);
app.post('/login', loginController);

app.get('/register', registerController);
app.post('/register', registerController);

app.listen(3000, () => {
  console.log('server is running at port:3000');
});