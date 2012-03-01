// data store (will change these to put into the database)
var history = new Array();
var clients = new Array();

// static variables
var webSocketsServerPort = 1337;

var http = require('http');
var io = require('socket.io');
var fs = require('fs');

var server = http.createServer(function(req, res) {
    fs.readFile('./index.html', function(err, data) {
        if(err) {
            res.writeHead(500);
            return res.end('Error loading index html');
        }
        res.writeHead(200);
        res.end(data);
    });
});
server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + ' Server is listening on port ' + webSocketsServerPort);
});

// create a Socket.IO instance
var io = io.listen(server);

// add a listener
io.sockets.on('connection', function(socket) {
    console.log((new Date()) + ' Connection from ' + socket + '.');

    var index = clients.push(socket) - 1;
    var userName = false;

    console.log((new Date()) + ' Connection accepted.');
    
    // send back chat history
    if (history.length > 0) {
        socket.json.send(JSON.stringify( { type: 'history', data: history} ));
    }

    // handle welcome info from users
    socket.on('welcome', function(message) {
        if (message != null && message != '') {
            if (userName === false) {
                userName = message;
                console.log((new Date()) + ' User ' + userName + ' is joined.');
                // broadcast joined person's name to all connected sockets
                var obj = {
                    time: (new Date()).getTime(),
                    name: userName,
                };
                var json = JSON.stringify({ type:'welcome', data: obj });
                socket.broadcast.send(json);
            }
        }
    });

    // handle all messages from users
    socket.on('message', function(message) {
        if (message != null && message != '') {
            if (userName != false) {
                console.log((new Date()) + ' Recieved Message from ' + userName + ': ' + message);

                // record a history
                var obj = {
                    time: (new Date()).getTime(),
                    text: message,
                    name: userName,
                };
                history.push(obj);

                // broadcast message to all connected sockets
                var json = JSON.stringify({ type:'message', data: obj });
                socket.broadcast.send(json);
            }
        }
    });

    socket.on('close', function(socket) {
        if (userName !== false) {
            console.log((new Date()) + " Peer " + socket.remoteAddress + " disconnected.");
            clients.splice(index, 1);
        }
    });
});

