var express = require('express');
var bodyParser = require('body-parser');

var router = express.Router();
var globals = require('.././global');
var connectionUtils = require('../lib/connectionUtils.js');

var router = express.Router();
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

/** Returns total socket connections. */
router.get('/', function(req, res, next) {
    connectionUtils.getAllLiveSocketConnectionsCount(function (err, count) {
        res.json (
            {
                "connections": {
                    "global": {
                        "sockets": count
                    }
                }
            }
        );
    });
    return;
});

/** Returns total live subscribers. */
router.get('/subscribers', function(req, res, next) {
    return 'NA';
});

/** Returns live subscribers by organization. */
router.get('/subscribers/:orgToken', function(req, res, next) {
    return 'NA';
});

/** GET live socket connections for this organization. */
router.get('/:orgToken', function(req, res, next) {
    res.json({});
    return;
});

module.exports = router;
