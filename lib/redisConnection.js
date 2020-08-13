/**
 * Created by Suyash on 8/14/17.
 */
var globals = require('../global');

var redisConnection = require('redis').createClient(globals.redis.connection_opts);
redisConnection.on('error', function (err) {
    console.log("[REDIS] Error while connecting to redis with configuration " + JSON.stringify(globals.redis.connection_opts), err);
});
/*
 client will emit ready once a connection is established. Commands issued before the ready event are queued,
 then replayed just before this event is emitted.
 */
redisConnection.on('ready', function (res) {
    console.log("[REDIS] redis is ready to accept events " + JSON.stringify(globals.redis.connection_opts), res);
});
redisConnection.on('connect', function (res) {
    console.log("[REDIS] redis is connected " + JSON.stringify(globals.redis.connection_opts), res);
    globals.redis.connected = true;
});
/*
 client will emit end when an established Redis server connection has closed.
 */
redisConnection.on('end', function (res) {
    console.log("[REDIS] established redis connection has closed. " + JSON.stringify(globals.redis.connection_opts), res);
});
/*
 client will emit reconnecting when trying to reconnect to the Redis server after losing the connection.
 Listeners are passed an object containing delay (in ms) and attempt (the attempt #) attributes.
 */
redisConnection.on('reconnecting', function (res) {
    console.log("[REDIS] redis trying to reconnect. " + JSON.stringify(globals.redis.connection_opts), res);
});
/*
 client will emit warning when password was set but none is needed and if a deprecated option / function / similar is used.
 */
redisConnection.on('warning', function (res) {
    console.log("[REDIS] redis trying to reconnect. " + JSON.stringify(globals.redis.connection_opts), res);
});

module.exports = {
    set: function (key, value, expiryInSec, callback) {
        var _this = this;
        redisConnection.set(key, value, function(err, reply) {
            if(expiryInSec>0) _this.expire(key, expiryInSec);
            if(!!callback) {
                callback(err, reply);
            }
        });
    },
    get: function (key, callback) {
        redisConnection.get(key, function (err, reply) {
            if(!!callback) {
                callback(err, reply);
            }
        });
    },
    del: function (key, callback) {
        redisConnection.del(key, function (err, reply) {
            if(!!callback) {
                callback(err, reply);
            }
        });
    },

    /**
    *   Sets field-value pair in redis hash.
    *   @param fvpairs - Array of field - value pair. e.g. ["k1", "v1", "k2", "v2"]
    *   
    */
    hmset: function (key, fvpairs, expiryInSec, callback) {
        var _this = this;
        redisConnection.hmset(key, fvpairs, function (err, reply) {
            if(expiryInSec>0) _this.expire(key, expiryInSec);
            if(!!callback) {
                callback(err, reply);
            }
        });
    },

    /**
    *   Returns all values associated with given fields for the hash.
    */
    hmget: function (key, fields, callback) {
      redisConnection.hmget(key, fields, function (err, res) {
          if(!!callback) {
              callback(err, res);
          }
      });
    },

    hgetall: function (key, callback) {
        redisConnection.hgetall(key, function (err, obj) {
            if(!!callback) {
                callback(err, obj);
            }
        });
    },

    /**
    *   Returns a value associated with given field for the hash.
    */
    hget: function (key, field, callback) {
        redisConnection.hget(key, field, function (err, res) {
            if(!!callback) {
                callback(err, res);
            }
        });
    },
    /**
     *   Removes fields for the hash.
     */
    hdel: function (key, fields, callback) {
        redisConnection.hdel(key, fields, function (err, res) {
            if(!!callback) {
                callback(err, res);
            }
        });
    },

    expire: function (key, expiryInSec) {
        redisConnection.expire(key, expiryInSec);
    },

    incrBy: function (key, value, callback) {
        var _this = this;
        redisConnection.incrBy(key, value, function(err, reply) {
            if(!!callback) {
                callback(err, reply);
            }
        });
    },

    decrBy: function (key, value, callback) {
        var _this = this;
        redisConnection.decrBy(key, value, function (err, reply) {
            if (!!callback) {
                callback(err, reply);
            }
        });
    },

    incr: function (key, callback) {
        var _this = this;
        redisConnection.incr(key, function(err, reply) {
            if(!!callback) {
                callback(err, reply);
            }
        });
    },

    decr: function (key, callback) {
        var _this = this;
        redisConnection.decr(key, function (err, reply) {
            if (!!callback) {
                callback(err, reply);
            }
        });
    }
}