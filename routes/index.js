var globals = require('.././global');
var express = require('express');
var router = express.Router();
var Promise = require('bluebird');
var fs = require('fs');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "https://suyash.services.com");
    res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", true);
    res.send('<h1>Welcome to Wigzo Notification Service</h1>');
  //res.render('index', { title: 'Wigzo' });
});

/* Heartbeat. */
router.get('/heartbeat', function(req, res, next) {
  res.send('');
});

router.get('/version', function(req, res, next) {
    fs.readFile(globals.project_root + '/bin/conf/version.conf', 'utf8', function (err,data) {
        if (err) {
            res.send("error while fetching version");
        }
        res.send(data);
    });
});

module.exports = router;