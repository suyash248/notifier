/**
 * Created by Suyash on 12/28/16.
 */
const uuidV4 = require('uuid/v4');
var globals = require('../global');
var mustache = require('mustache');
var redisConnection = require('../lib/redisConnection');

module.exports = {
    msgNoticeBoardKey: 'NOTIFIER:NOTICEBOARD:MESSAGE:ORG:{{org_token}}:COOKIE:{{cookie_id}}', // Key
    userMsgKey: 'NOTIFIER:USER:MESSAGE:COOKIE:{{cookie_id}}:MSG:{{msg_id}}', // Key
    getNoticeBoardKey: function (orgToken, cookieId) {
        var noticeBoardKey = mustache.render(this.msgNoticeBoardKey, {org_token: orgToken, cookie_id: cookieId});
        return noticeBoardKey;
    },
    getUserMsgKey: function (cookieId, msgId) {
        var userMsgKey = mustache.render(this.userMsgKey, {cookie_id: cookieId, msg_id: msgId});
        return userMsgKey;
    },
    /**
     *  Write message on notice board by inserting message json in redis key represented by msgNoticeBoardKey.
     *  All the users check notice board for pending messages(if any) once they have successfully joined.
     *
     * @param message <message_json>
     */
    writeMessageToNoticeBoard: function (message) {
        var orgToken = message['org_token'];
        var cookieId = message['cookie_id']
        var noticeBoardKey = this.getNoticeBoardKey(orgToken, cookieId);
        var msgJson = JSON.stringify(message);
        var kvPair = [cookieId, msgJson];

        redisConnection.set(noticeBoardKey, msgJson, message.ttl, function (err, res) {
            console.log("[WRITE] Writing message for " + cookieId + " of org " + orgToken + " : " + res);
        });
    },
    /**
     * Personal messages will be removed from notice board, once target user read them successfully.
     * @param orgToken
     * @param cookieId
     * @param callback
     */
    removeMessageFromNoticeBoard: function (orgToken, cookieId, callback) {
        var noticeBoardKey = this.getNoticeBoardKey(orgToken, cookieId);
        redisConnection.del(noticeBoardKey, callback);
    },
    getMessageForUser: function (orgToken, cookieId, callback) {
        var redisKey = this.getNoticeBoardKey(orgToken, cookieId);
        redisConnection.get(redisKey, callback);
    },
    /**
    *   Once user has read the message, mark that message as READ by creating an entry
    *   by inserting value 1 corresponding to redis key userMsgKey.
    */
    markMessageAsRead: function (cookieId, msgId, ttl) {
        var userMsgKey = this.getUserMsgKey(cookieId, msgId);
        redisConnection.set(userMsgKey, 1, ttl + 5);
    },
    /**
     * Checks if this message is read by this user, by checking {@link userMsgKey}
     * @param cookieId
     * @param msgId
     * @param callback
     */
    isRead: function (cookieId, msgId, callback) {
        var userMsgKey = this.getUserMsgKey(cookieId, msgId);
        redisConnection.get(userMsgKey, callback);
    }
};
