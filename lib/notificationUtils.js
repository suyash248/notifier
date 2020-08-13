/**
 * Created by Suyash on 12/29/16.
 */
var globals = require('../global');
var message = require('../model/message');

module.exports = {
    requiredProps: [
        {name: "message", type: "object"},
        {name: "campaign_id", type: "number"},
        //{name: "to_socket_id", type: "string"},
        {name: "cookie_ids", type: "object"},    // Array
        {name: "org_token", type: "string"}
    ],
    validateMessage: function (msg) {
        var isValid = true;
        for(var i in this.requiredProps) {
            var reqProp = this.requiredProps[i];
            if(msg.hasOwnProperty(reqProp.name) && typeof msg[reqProp.name]==reqProp.type) {
                continue;
            } else {
                console.log(["[INVALID PROPS]", msg[reqProp.name]]);
                isValid = false;
                break;
            }
        }
        return isValid;
    },

    sendPendingMessages: function(orgToken, cookieId) {
        message.getMessageForUser(orgToken, cookieId, function (err, msgJson) {
            if(!!msgJson) {
                var msg = JSON.parse(msgJson);
                if(!msg.hasOwnProperty('msg_id')) {
                    console.log("[INVALID] Invalid msg, msg must contain msg_id" + msgJson);
                }
                message.isRead(cookieId, msg.msg_id, function(err, isRead){
                    if(!!isRead && isRead==1) {
                        console.log('[READ] Message(for ' + cookieId + ') ' + msg.msg_id + ' is already READ by user ' + cookieId);
                    } else {
                        console.log('[PENDING] Send pending message ' + msg.msg_id + ' for user ' + cookieId);
                        globals.io.to(cookieId).emit('notify', msg);
                    }
                });
            }
        });

        message.getMessageForUser(orgToken, '*', function (err, msgJson) {
            if(!!msgJson) {
                var msg = JSON.parse(msgJson);
                if(!msg.hasOwnProperty('msg_id')) {
                    console.log("[INVALID] Invalid msg, msg must contain msg_id" + msgJson);
                }
                message.isRead(cookieId, msg.msg_id, function(err, isRead){
                    if(!!isRead && isRead==1) {
                        console.log('[READ] Message(for *) ' + msg.msg_id
                            + ' is already READ by user ' + cookieId);
                    } else {
                        console.log('[PENDING] Send pending essage ' + msg.msg_id + ' for user ' + cookieId);
                        globals.io.to(cookieId).emit('notify', msg);
                    }
                });
            }
        });
    }
}