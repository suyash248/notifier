/**
 * Created by Suyash on 1/6/17.
 */
var shell = require('shelljs');
var fs = require('fs');
var https = require('https');
var http = require('http');
var globals = require('../global');
var path = require('path');

if(process.argv.length<3) {
    console.log("No cloud platform type found. e.g. aws, google.... using aws as default");
    process.argv[2] = 'aws';
}
var currentBranch = shell.exec("git symbolic-ref --short -q HEAD");
var cloudPlatform = process.argv[2];
var binPath = __dirname;
var confPath = path.join(binPath, 'conf');
var project_root = path.dirname(binPath);
var redisLockKey = 'RAY_DEPLOY_LOCK';

function getLocalVersion() {
    var localVersionPromise = new Promise(function (resolve, reject) {
        console.log("Getting local file version...");
        fs.readFile(confPath + '/version.conf', 'utf8', function (err, data) {
            if (err) {
                reject(err);
            }
            console.log("LOCAL Version -> " + data);
            resolve(data);
        });
    });
    return localVersionPromise;
}

function getRemoteVersion() {
    if(!currentBranch) {
        currentBranch = "master";
    }
    console.log("current branch -> " + currentBranch);
    var options = {
        host: "raw.githubusercontent.com",
        path: "/suyash/notifier/"+currentBranch+"/bin/conf/version.conf?_=" + Date.now(),
        headers: {
            "Authorization": "token 62b29debd5c0300dea329a29bbf13387fb0d19e4",
            "Accept": "application/vnd.github.v3.raw",
        }
    };
    var remoteVersionPromise = new Promise(function (resolve, reject) {
        console.log("Getting remote file version...");
        https.get(options, function (response) {
            var data = '';
            var i = 0;
            response.on('data', function (chunk) {
                i++;
                data += chunk;
            });
            response.on('end', function () {
                console.log("REMOTE Version -> " + data);
                resolve(data);
            });
        });
    });
    return remoteVersionPromise;
}

function getCurrentHost() {
    var currentHostPromise;
    if(cloudPlatform==='aws') {
        currentHostPromise = new Promise(function (resolve, reject) {
            console.log("Getting aws host...");
            http.get({host: "32.26.10.90", path: "/latest/meta-data/public-hostname"}, function (response) {
                var data = '';
                var i = 0;
                response.on('data', function (chunk) {
                    i++;
                    data += chunk;
                });
                response.on('end', function () {
                    console.log("AWS HOST -> " + data);
                    resolve(data);
                });
            });
            //resolve('n1');
        });
    } else if(cloudPlatform==='google') {
        currentHostPromise = new Promise(function (resolve, reject) {
            console.log("Getting current host...");
            shell.exec('curl http://metadata/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H "Metadata-Flavor: Google"', function(code, publicIp, stderr){
                console.log("Public IP -> " + publicIp);
                shell.exec('host ' + publicIp, function(code, hostDetails, stderr) {
                    var host = hostDetails.substring(hostDetails.lastIndexOf(' ')+1, hostDetails.length-1);
                    resolve(host);
                });
            });
            //resolve('n1');
        });
    }
    return currentHostPromise;
}


function connectRedis() {
    var redisConnectionPromise = new Promise(function (resolve, reject) {
        var redis = require('redis');
        var redisClient = redis.createClient({
            url: 'redis://:redpwd@172.36.21.217:6379',
            return_buffers: true
        });

        redisClient.on("ready", function () {
            console.log('redis client - ready');
        });

        redisClient.on("connect", function () {
            console.log("redis client - connect");
            resolve(redisClient);
        });

        redisClient.on("error", function () {
            console.log("redis client - error");
            reject();
        });

    });
    return redisConnectionPromise;
}

Promise.all([getLocalVersion(), getRemoteVersion()]).then(function(results) {
    var localVersion = results[0];
    var remoteVersion = results[1];

    console.log("Local: " + localVersion + "Remote: " + remoteVersion);
    if(localVersion!==remoteVersion) {
        Promise.all([getCurrentHost(), connectRedis()]).then(function(resolvedRes) {
            var awsHost = resolvedRes[0];
            var redisClient = resolvedRes[1];
            sync(awsHost, redisClient);
        });
    } else {
        console.log('Everything is up-to-date');
        process.exit(0); 
    }
});

function sync(awsHost, redisClient) {
    redisClient.get(redisLockKey, function(err, keyExists) {
        if(keyExists) {
            console.log(keyExists + " | Can't acquire lock...gracefully quitting as of now.")
            process.exit(0);
        } else {
            console.log("Acquiring lock...");
            redisClient.set(redisLockKey, 1);
            redisClient.expire(redisLockKey, 60); // in seconds
            shell.cd(project_root);
            shell.exec('npm install', function(code, stdout, stderr) {
                console.log("npm install -> " + stdout);
                shell.exec('git stash', function(code, stdout, stderr) {
                    console.log("git stash -> " + stdout);
                    shell.exec('git pull', function(code, stdout, stderr) {
                        console.log("git pull -> " + stdout);
                    });
                });
            });
        }
    });
}

