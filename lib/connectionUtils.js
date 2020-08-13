/**
 * Created by Suyash on 12/29/16.
 */
var globals = require('../global');
var redisConnection = require('../lib/redisConnection');
//var mustache = require('mustache');

module.exports = {
    allSocketConnectionsKey: 'NOTIFIER:CONNECTIONS:SOCKET', // Key
    //orgSocketConnectionsKey: 'NOTIFIER:CONNECTIONS:SOCKET:ORG:{{org_token}}', // Key
    getAllSocketConnectionsKey: function () {
        return this.allSocketConnectionsKey;
    },
    getAllLiveSocketConnectionsCount: function (callback) {
        redisConnection.get(this.getAllSocketConnectionsKey(), function (err, res) {
            if(!!callback) {
                callback(err, res);
            }
        });
    },
    resetAllLiveSocketConnectionsCount: function () {
        redisConnection.del(this.getAllSocketConnectionsKey());
    },
    onConnect: function() {
        redisConnection.incr(this.getAllSocketConnectionsKey(), function (err, res) {
            console.log('[SOCKETS] Total socket connections : ' + res);
        });
    },
    onDisconnect: function() {
        redisConnection.decr(this.getAllSocketConnectionsKey(), function (err, res) {
            console.log('[SOCKETS] Total socket connections : ' + res);
        });
    }
}