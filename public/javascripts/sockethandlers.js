NotificationManager = function (NOTIFIER_NOTIFICATION_CENTER, ORG_TOKEN, NOTIFIER_USER_IDENTIFICATION, onConnectCallback, onDisconnectCallback) {
    if (typeof (io) === "undefined") {
        console.log ("Node is down... Please check!!");
        return;
    }
    if('WebSocket' in window || 'MozWebSocket' in window) {
        console.log("Connecting to " + NOTIFIER_NOTIFICATION_CENTER);
        var socket = io(NOTIFIER_NOTIFICATION_CENTER, {transports: ['websocket', 'flashsocket'], upgrade: false});
        var socketConnected = false;
        var retryInterval;

        socket.on("notify", function (data) {
            if(!data) {
                console.log('No pending message found!');
                return;
            }
            data.cookie_id = NOTIFIER_USER_IDENTIFICATION;
            console.log(data);
            var messageArea = document.getElementById('message');
            messageArea.insertAdjacentHTML('beforeend', '<p>' + JSON.stringify(data) + '</p><br/>');
            socket.emit('acknowledge', data);
        });

        socket.on('connect', function (sc) {
            socket.emit('join', {cookie_id: NOTIFIER_USER_IDENTIFICATION, org_token: ORG_TOKEN});
            socketConnected = true;
            clearInterval(retryInterval);
            if (onConnectCallback) {
                onConnectCallback(socket);
            }
        });

        /*socket.io.engine.on('heartbeat', function() {
         console.log('Getting heartbeat');
         socket.emit('heartbeat', {'notificationCenter': NOTIFIER_NOTIFICATION_CENTER, 'orgToken': ORG_TOKEN, 'username': username});
         });

         /*socket.on ('heartbeat', function(obj) {
         console.log(obj);
         });*/

        var reconnectSocketIO = function () {
            console.log("Trying to reconnect socket.io..", socketConnected);
            if (socketConnected) {
                clearInterval(retryInterval);
            }
        }

        socket.on('disconnect', function () {
            socket.emit('delete', {cookie_id: NOTIFIER_USER_IDENTIFICATION, org_token: ORG_TOKEN});
            socketConnected = false;
            retryInterval = setInterval(reconnectSocketIO, 10000);
            if (onDisconnectCallback) {
                onDisconnectCallback(socket);
            }
        });
    } else {
        console.info("This library requires WebSocket support.");
    }
}
