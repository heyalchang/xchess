var express = require('express')
var path = require( 'path' )
var app = express()

// Add JSON parsing middleware
app.use(express.json());

var port = process.env.PORT || 8080;

app.use('/dist', express.static(path.join(__dirname, '/dist')));
app.use('/assets', express.static(path.join(__dirname, '/assets')));

app.get('/', function(req,res){
  res.sendFile(__dirname + "/views/homepage.html");
})

// Game state API endpoint
app.get('/api/state', function(req, res) {
  // This will be populated by the game instance
  // For now, return a placeholder response
  const defaultState = {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    turn: 'white',
    moveCount: 0,
    inCheck: false,
    gameOver: false,
    isStalemate: false,
    lastMove: null,
    timestamp: Date.now()
  };
  
  res.json(defaultState);
});

// Move API endpoint
app.post('/api/move', function(req, res) {
  const { from, to, promotion } = req.body;
  
  // Placeholder response - will be implemented with game integration
  res.json({
    success: false,
    error: 'Game integration not yet complete'
  });
});

app.listen(port, function(){
	console.log(__dirname);
	console.log('Simple Server Running on port ' + port)
})
