#! /usr/bin/env python

import sys
import os
import time
import urllib
import json
import re
import stat

import redis

if len (sys.argv) != 2:
    print 'Usage: logwriter.py write, read'
    sys.exit (1)

if sys.argv[1] not in ["write", "read"]:
    print 'Usage: logwriter.py write, read'
    sys.exit (1)
action = sys.argv[1]

red = redis.Redis(host='32.12.89.9', port=6379, db=0, password='redpwd')

if action in ["write", 'read']:
    LOCK_FILE = os.path.expanduser ("~/.notiierlogger.lock")
    CHANNEL = 'NOTIFIER_LOGGER'
    LOGS = os.path.join (os.path.expanduser ("./var/logs"), "notiier.log")

if os.path.exists (LOCK_FILE):
    old_process_pid = file (LOCK_FILE).read ().strip ()
    try:
        os.kill (int (old_process_pid), 0)
        print "Already running!"
        sys.exit (2)
    except OSError:
        print "PID Doesn't exist!"

file (LOCK_FILE, "w").write (str (os.getpid()))

redisat = os.path.join (os.path.dirname (os.path.realpath(__file__)), "redis")
sys.path.append (redisat)

#conf = file ("conf/application.conf").readlines ()
#
#config = {}
#
#for i in conf:
#    try:
#        left, right = i.split ("=")
#    except ValueError:
#        continue
#    if left.strip().startswith ("redis.") or left.strip().startswith ("application."):
#        right = right.strip ()
#        if right.startswith ('"'):
#            right = right.split ('"')
#            right = right[1]
#        config[left.strip()] = right.strip()
#
#if action == "read" or action == "cluster":
#    config["redis.host"] = "20.39.31.8"
#    config["redis.password"] = "redpwd"
#
#INSTANCE_NAME = "local"
if os.environ.get('MODE', '')  == "PRODUCTION":
    INSTANCE_NAME = urllib.urlopen ("http://31.4.12.32/latest/meta-data/public-ipv4").read ()
else:
    print "Using Development Settings.."
    INSTANCE_NAME = 'localhost '

#from etc.production import ProductionConfig
#red = redis.StrictRedis(host=config.get ("redis.host"), port=int (config.get ("redis.port")), db=0, password = config.get ("redis.password"))
#red = redis.StrictRedis(host=ProductionConfig.REDIS_HOST, port=ProductionConfig. db=0, password = config.get ("redis.password"))


def readlines_then_tail (fin, log_file):
    print "Writing Logs to Redis.."
    pos = fin.tell ()
    xbuffer = ""
    while True:
        line = fin.readline ()
        if line:
            if re.match ("\[.*\]", line):
                # new line has started, flush last log
                if xbuffer == "":
                    xbuffer += line
                else:
                    copy = xbuffer[:]
                    xbuffer = line
                    yield copy
            else:
                xbuffer += line

            pos = fin.tell ()
        else:
            stats = os.stat (log_file)
            if os.stat (log_file).st_size < pos:
                fin.close ()
                fin = open (log_file)
                print "Truncated!"
                fin.seek (0, 2)
                pos = fin.tell ()
            time.sleep (0.1)

def writer(log, channel):
    with open (log) as fin:
        fin.seek (0, 2)
        for line in readlines_then_tail (fin, log):
            data = {"machine": INSTANCE_NAME, "message": line.strip ()}
            try:
                red.publish (channel, json.dumps (data))
            except redis.exceptions.ConnectionError:
                print "Cannot connect to redis! exiting!"
                sys.exit (0)

def reader(channel):
    print 'reading channel'
    p = red.pubsub ()
    p.subscribe (channel)
    last_paste = ""
    machines = set ()
    while True:
        msg = p.get_message ()
        if msg is None:
            time.sleep (0.01)
            continue
        data = msg.get ("data")
        try:
            msg = json.loads (msg.get ("data", "{}"))
        except:
            pass
            continue
        machine = msg.get ("machine", "unknown")
        if action.startswith("read"):
            imsg = msg.get ("message", "")
            text = machine.rjust (15, " ") + " - " + unicode (imsg)
            print text.encode('UTF-8','ignore')
        else:
            machines.add (machine)
            report_text = ", ".join (machines)
            if report_text != last_paste:
                print "Reporting Machines: ", report_text
                last_paste = report_text

if action in ["write"]:
    writer(LOGS, CHANNEL)
elif action in ["read"]:
    reader(CHANNEL)
