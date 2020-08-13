/**
 * Created by Suyash on 12/28/16.
 */
var path = require('path');
var GLOBALS = {};
if(process.env['MODE']==='PRODUCTION') {
    GLOBALS = {
        secret:'jkliodkbkasdalksdjuiwhskslsuiohnlawsdhpkwq9pomc',
        project_root: __dirname, //process.cwd(),
        mode: "PRODUCTION",
        useSSL: false,
        redis: {
            connected: false,
            connection_url: 'redis://:redpwd@12.1.2.4:6379',
            connection_opts: {
                host: "12.3.2.32",
                port: 6379,
                password: 'xp2#$kal1'
            }
        },
        workers: {
            start_port: 3000,
            ports: []
        },
        version: "rc1.1.0",
        connected: 0,   // deprecated
        connections: {} // deprecated
    }
} else {
    GLOBALS = {
        secret:'jkliodkbkasdalksdjuiwhskslsuiohnlawsdhpkwq9pomc',
        project_root: __dirname,//process.cwd(),
        mode: "DEVELOPMENT",
        useSSL: false,
        redis: {
            connected: false,
            connection_opts: {
                host: "127.0.0.1",
                port: 6379,
                password: 'redpwd'
            }
        },
        workers: {
            start_port: 3000,
            num: 4,
            ports: []
        },
        version: "rc1.1.0",
        connected: 0,   // deprecated
        connections: {} // deprecated
    }
}

module.exports = GLOBALS;
