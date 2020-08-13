var express = require('express');
var bodyParser = require('body-parser');
const uuidV4 = require('uuid/v4');
var globals = require('.././global');
var message = require('../model/message');
var notificationUtils = require('../lib/notificationUtils');

var router = express.Router();
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

router.post ('/', function (req, res) {
    var cookieIds = req.body.cookie_ids;
    var orgToken = req.body.org_token;
    console.log ("[DELIVERY] for: " + req.body.cookie_ids + " (of org: "+req.body.org_token+")");
    if (! req.headers.hasOwnProperty ("x-auth")) {
        res.json ({"status": "failed", "code": 403, "reason": "authentication required"});
        return;
    }
    var auth = req.headers["x-auth"];
    if (auth !== globals.secret) {
        res.json ({"status": "failed", "code": 403, "reason": "bad authentication"});
        return;
    }

    if(!notificationUtils.validateMessage(req.body)) {
        res.json ({"status": "failed", "code": 400, "reason": "Invalid message content, message must contain required properties", "validFormat": notificationUtils.requiredProps});
        return;
    }

    for(var i=0; i<cookieIds.length; i++) {
        var cookieId = cookieIds[i].trim();
        var msg = {};
        msg = Object.assign(msg, req.body);
        msg['msg_id'] = msg.msg_id || uuidV4();
        msg['ttl'] = msg.ttl || 60 * 30;
        msg['org_token'] = msg.org_token || orgToken;
        msg['cookie_id'] = msg.cookie_id || cookieId;
        msg['created_at'] = Date.now();
        var targetRoom = cookieId;
        if(cookieId=='*') {
            targetRoom = orgToken;
        }
        globals.io.to(targetRoom).emit ('notify', msg);    // Message will be sent immediately to live connection.
        // Write message to notice board.
        message.writeMessageToNoticeBoard(msg);
    }

    res.json ({"status": "ok", "code": 200});
    return;
});


router.post ('/rooms', function (req, res) {
    if(!req.body.hasOwnProperty("rooms")) {
        res.json ({"status": "failed", "code": 400, "reason": "Invalid message format.", "validFormat": {rooms: "Array<String>", payload: "object"}});
    }
    console.dir ("> Notification delivery for room(s) : " + req.body.rooms);
    if (! req.headers.hasOwnProperty ("x-auth")) {
        res.json ({"status": "failed", "code": 403, "reason": "authentication required"});
        return;
    }
    var auth = req.headers["x-auth"];
    if (auth !== globals.secret) {
        res.json ({"status": "failed", "code": 403, "reason": "bad authentication"});
        return;
    }
    var persist = req.body.persist || false;
    if(persist) {
        // Need to persist payload...Don't use "message" collection to save this message as payload might be different from "message" schema.
    }
    for(var i in req.body.rooms) {
        globals.io.to(req.body.rooms[i]).emit ('notify', req.body.payload);    // Message will be sent immediately to live connection.
    }

    res.json ({"status": "ok", "code": 200});
    return;
});

module.exports = router;
