/**
 * Created by Suyash on 1/13/17.
 */
var globals = require('.././global');
var express = require('express');
//var connectionUtils = require('../lib/connectionUtils.js');
var router = express.Router();
var Promise = require('bluebird');
var fs = require('fs');

router.get('/', function(req, res, next) {
    var status = {
        redis : {
            connected: globals.redis.connected
        },
        socket_io: require('socket.io/package').version
    };
    res.json(status);
    return;
});

module.exports = router;