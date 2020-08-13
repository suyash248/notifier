var express = require('express');
var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var net = require('net');
var globals = require('./global');
var message = require('./model/message');

var notificationUtils = require('./lib/notificationUtils');
var connectionUtils = require('./lib/connectionUtils.js');

var sticky = require('sticky-session');
var os = require('os');
console.log(globals.project_root);
console.log(process.argv);
globals.instance = {
    name: process.argv[2]
}

var app = new express();
app.enable('trust proxy');

//ENABLE CORS
app.all('/', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

var options = {
    key: fs.readFileSync('ssl/notiier.key'),
    cert: fs.readFileSync('ssl/notiier.wildcard.chained.crt')
};

var server;
if (globals.useSSL) {
   server = https.createServer(options, app);
} else {
   server = http.createServer(app);
}

var port = globals.workers.start_port + parseInt(process.argv[3]);
server.listen(port, function(err) { // port
    if (err) {
        console.log("[" + globals.mode +"] Error while starting server.", err);
    }
    console.log("[" + globals.mode +"] Instance started on port", port); // port
});

var sockets = require('socket.io')();
var io = sockets.listen(server,{ resource: '/socket.io/','sync disconnect on unload':true });
io.set('origins', '*:*');
io.set('transports', ['websocket']);
console.log ("SocketIO Version: " + require('socket.io/package').version);
globals.io = io;

// Tell Socket.IO to use the redis adapter. By default, the redis
// server is assumed to be on localhost:6379. You don't have to
// specify them explicitly unless you want to change them.

var redisSIO = require('socket.io-redis');
if(globals.mode==='DEVELOPMENT') {
    io.adapter(redisSIO({host: globals.redis.host, port: globals.redis.port}));
    io.of('/').adapter.on('error', function () {
        console.log("Error while initializing socket.io-redis adapter.");
    });
} else if(globals.mode==='PRODUCTION') {
    var client = require('redis').createClient;
    var pub = client({url: globals.redis.connection_url, return_buffers: true});
    var sub = client({url: globals.redis.connection_url, return_buffers: true});
    io.adapter(redisSIO({ pubClient: pub, subClient: sub }));

    pub.on("ready", function(){
        console.log('redis pub - ready');
    });

    pub.on("connect", function(){
        globals.redis.connected = true;
        console.log("redis pub - connect");
    });

    pub.on("error", function(){
        console.log("redis pub - error");
    });

    sub.on("ready", function(){
        console.log('redis sub - ready');
    });

    module.exports = app;
    module.exports = globals;
}

/********************************** routes **************************************/
var index = require('./routes/index');
var connections = require('./routes/connections');
var notify = require('./routes/notify');
var status = require('./routes/status');
var test = require('./routes/test');

app.use('/notiier', index);
app.use('/notiier/connections', connections);
app.use('/notiier/notify', notify);
app.use('/notiier/status', status);
app.use('/notiier/test', test);

app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');

//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    res.json(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.json(err);
    //res.render('error');
    //next();
});

module.exports = app;
module.exports = globals;

/*
 - Uncomment it if you want to send heartbeat constantly.
 io.set('heartbeat timeout', 4000);
 io.set('heartbeat interval', 5000);
 */

io.on ('connection', function (socket) {
    socket.on ('disconnect', function(e) {
        console.log("[DELETED] connection deleted successfully,  socket id : " + socket.id);
    });

    socket.on ('join', function (data) {
        var clientIp = socket.request.connection.remoteAddress, sHeaders = socket.handshake.headers;
        var orgToken = data.org_token, cookieId = data.cookie_id;
        var userAgent = "";
        if (sHeaders.hasOwnProperty ('user-agent')) {
            userAgent = sHeaders['user-agent'];
        }
        console.log("[JOINED]", JSON.stringify({
            orgToken: orgToken,
            cookieId: cookieId,
            socketId: socket.id,
            clientIp: clientIp,
            "x-forwarded-for": sHeaders['x-forwarded-for'],
            instance: process.argv[2]
        }));
        /*console.log ("[JOINED] Cookie: " + cookieId + " | org: " + orgToken + " (" + socket.id + " @ " + sHeaders['x-forwarded-for']
            + ") on instance " + process.argv[2] + ", Remote address - " + clientIp);*/

        socket.join(orgToken); // join room, room name is <org_token>, meant for sending global(*) message.
        socket.join(cookieId); // join room, room name is <cookie_id>. meant for sending personal/individual message.

        // Send pending messages.
        notificationUtils.sendPendingMessages(orgToken, cookieId);
    });

    // Acknowledgement sent by client once message is received.
    socket.on('acknowledge', function(data) {
        if(data.hasOwnProperty("org_token") && data.hasOwnProperty("cookie_id") && data.hasOwnProperty("msg_id")) {
            var orgToken = data['org_token'];
            var cookieId = data['cookie_id'];
            var msgId = data['msg_id'];
            for(var i in data.cookie_ids) {
                var cid = data.cookie_ids[i];
                if(cid=='*') {
                    message.markMessageAsRead(cookieId, msgId, data.ttl);
                } else if(cid==cookieId){
                    // Personal messages will be removed from notice board, once target user read them successfully.
                    // Delete user's individual message from notice board. (Letter box)
                    message.removeMessageFromNoticeBoard(orgToken, cookieId);
                }
            }
            console.log("Message - " + data.msg_id + " has been read by user - " + data.cookie_id);
        }
    });

    socket.on ('error', function (err) {
        console.error (err.stack);
    });
});
