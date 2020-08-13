var express = require('express');
var router = express.Router();
var globals = require('../global');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile(globals.project_root + "/test/client.html");
});

router.get('/send', function(req, res, next) {
    res.sendFile(globals.project_root + "/test/sendnotification.html");
});

module.exports = router;
