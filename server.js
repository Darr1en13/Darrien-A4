const express = require('express');
const app = express();

var mysql = require('mysql');

const conInfo = 
{
    host: process.env.IP,
    user: process.env.C9_USER,
    password: "",
    database: "STATSDB"
};

var session = require('express-session'); 
app.use(session({ secret: 'happy jungle', 
                  resave: false, 
                  saveUninitialized: false, 
                  cookie: { maxAge: 60000 }}));

app.get('/', instructions);                  
app.get('/game', game);
app.get('/stats', stats);
//app.get('/add', add);

app.listen(process.env.PORT,  process.env.IP, startHandler());

var guesss;

function startHandler()
{
  console.log('Server listening on port ' + process.env.PORT);
}

function game(req, res)
{

  var result = {};
  var victory = false;
 
  
  if (req.session.answer == undefined)
    {
      req.session.guesses = 0;
      req.session.answer = Math.floor(Math.random() * 100) + 1;
    }
    console.log(req.session.answer);
 
    if (req.query.guess == undefined)
    {
      result = {'gameStatus' : 'Pick a number from 1 to 100.'}; 
      req.session.guesses = 0;
      req.session.answer = Math.floor(Math.random() * 100) + 1;
      writeResult(req,res,result);

    }
    // a guess was made, check to see if it is correct...
    else if (req.query.guess == req.session.answer)
    {
      req.session.guesses = req.session.guesses + 1;
      result = {'gameStatus' : `Correct! It took you ${req.session.guesses} guesses. Play Again!`}; 
      req.session.answer = undefined;
      guesss = req.session.guesses;
      victory = true;
    }
    else if (req.query.guess > req.session.answer)
    {
      req.session.guesses = req.session.guesses + 1;
      result = {'gameStatus' : 'To High. Guess Again!', 'guesses' : req.session.guesses}; 
      writeResult(req,res,result);
    }
    else
    {
      req.session.guesses = req.session.guesses + 1;
      result = {'gameStatus' : 'To Low. Guess Again!', 'guesses' : req.session.guesses}; 
      writeResult(req,res,result);
    }
    console.log(req.query.guess);
if(victory == true)//IF GAME WAS WON, WRITE IT TO DATABASE.
{
  
  var con = mysql.createConnection(conInfo);
  con.connect(function(err) 
  {
    if (err) 
      writeResult(req, res, {'error' : err});
    else
    {
      con.query('INSERT INTO STATS (STATS_TRYS) VALUES (?)',[guesss], function (err, result, fields) 
      {
        if (err) 
          writeResult(req, res, {'error' : err});
        else
          writeResult(req, res, {'gameStatus' : `Correct! It took you ${req.session.guesses} guesses. Play Again!`});
      });
    }
  });
}
}

function instructions(req, res)
{
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write("<h1 style = color:red>Welcome to the most sophisticated Number Guessing Game</h1>");
  res.write("<p>Use /game to start a new game.</p>");
  res.write("<p>Use /game?guess=num to make a guess.</p>");
  res.end('');
}

function stats(req, res)
{
  var con = mysql.createConnection(conInfo);
  con.connect(function(err) 
  {
    if (err) 
      writeResult(res, {'error' : err});
    else
    {
      con.query("SELECT  (SELECT MIN(STATS_TRYS) FROM STATS) AS BEST,(SELECT MAX(STATS_TRYS)  FROM STATS) AS WORST, (SELECT COUNT(*) FROM STATS) AS TOTAL", function (err, result, fields) 
      {
        if (err) 
          writeResult(req, res, {'error' : err});
        else
          writeResult(req, res, {'result' :  {'best':result[0].BEST ,'worst':result[0].WORST,'total':result[0].TOTAL } });
      }); 
   
    }
  });
}

function writeResult(req,res, obj)
{
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.write(JSON.stringify(obj));
  res.end('');
}


