const express = require('express');
const logger = require('morgan');
const path = require('path');
const fs = require('fs');
const rfs = require('rotating-file-stream');
const cors = require('cors');
const bodyParser = require('body-parser');
const passport = require('passport');
const mongoose = require('mongoose');

//Professors Catalog JSON File
const professorsData = JSON.parse(fs.readFileSync('./assets/professors.json', 'utf8'));

const Schema = mongoose.Schema;

//Professor Catalog Schema
const ProfessorCatalogSchema = new Schema({
  firstName: String,
  lastName: String,
  email: {
    type: String,
    unique: true,
    required: true
  }
});

//Professor Catalog Model
const ProfessorCatalog = module.exports = mongoose.model('ProfessorCatalog', ProfessorCatalogSchema, 'professor-catalog');

//Load Config
const environmentHosting = process.env.NODE_ENV || 'Development';
console.info(`Starting configuration for: ${environmentHosting}`);
const config = require('./config/keys');

//Connect to DB
mongoose.Promise = global.Promise;
mongoose.connect(config.mongoURI, {
    useMongoClient: true
  })
  .then(() => {
    console.info(`Connected to ${environmentHosting} database`);
    //Check if there's Professor Catalog collection in the database
    mongoose.connection.db.listCollections({
        name: 'professor-catalog'
      })
      .next((err, collection) => {
        if (!collection) {
          ProfessorCatalog.insertMany(professorsData.professors, (err, result) => {
            if (err) console.error('Error adding professors catalog: ', err);
          });
        } else {
          //Check Professor Catalog collection count
          ProfessorCatalog.count({}, (err, count) => {
            if (count < professorData.professors.length) {
              //If Count in collection is less than data length, drop the collection
              mongoose.connection.db.dropCollection('professor-catalog');
              //Re-insert
              ProfessorCatalog.insertMany(professorsData.professors, (err, result) => {
                if (err) console.error('Error adding professors catalog: ', err);
              });
            }
          });
        }
      });
  }).catch((err) => console.log(`Error connecting to database: ${err}`));

//Init Express Variable
const app = express();

//Log Directory
const logDirectory = path.join(__dirname, 'debug');

//Ensure log directory is existed
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

//Init Rotating File Stream Daily
const accessLogStream = rfs('access.log', {
  interval: '1d', //1 day
  path: logDirectory
});

//Init Morgan logger
app.use(logger('dev'));
app.use(logger('common', {
  stream: accessLogStream
}));

//PORT Variable
const port = process.env.PORT || 3000;

//Load Routes
const professors = require('./routes/professors');

//CORS Middleware
app.use(cors());

//BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false,
  limit: "5mb",
  parameterLimit: 5000
}));

//Passport Middleware
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

//Set Static folder
app.use(express.static(path.join(__dirname, 'build')));

//Use Routes
app.use('/professors', professors);

//Testing index route
app.get('/', (req, res) => {
  res.send('Testing index');
});

//Catch All Routes
app.all('*', (req, res) => {
  res.sendFile(__dirname, 'build/index.html');
});

//Start Server
app.listen(port, () => {
  if (port === 3000) {
    console.log(`Server started on http://localhost:${port}`);
  } else {
    console.log(`Server started on ${port}`);
  }
});