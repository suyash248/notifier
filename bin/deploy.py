import os, sys
import urllib2
import json
import time
import redis

args = sys.argv

if(len(args)<2):
    print("Please provide cloud platform type. e.g. aws, google...using aws as default");
    cloud_platform = 'aws'
else:
    cloud_platform = sys.argv[1];

notifier_endpoint = "https://services.notifier.com/notifier" # "http://localhost:3000/notifier"
redis_lock_key = 'notifier_DEPLOY_LOCK';
redis_lock_duration = 60; # 60 seconds
number_of_processes = 4

script_path = os.path.realpath(__file__)
bin_dir = os.path.dirname (script_path)
conf_dir = os.path.join(bin_dir, 'conf');
project_root_dir = os.path.dirname (bin_dir)
os.chdir (project_root_dir)
current_branch = os.popen("git symbolic-ref --short -q HEAD").read().replace('\n', '');
print("Current branch : " + current_branch)
def get_local_version():
    with open(os.path.join(conf_dir, 'version.conf'), 'r') as localVerFile:
        local_version=localVerFile.read().replace('\n', '');
    return local_version

def get_remote_version ():
    address = "https://raw.githubusercontent.com/pleomax00/wigzo-notifier/"+current_branch+"/bin/conf/version.conf?_=" + str (time.time())
    headers = {
        "Authorization": "token 78juidebd3k0347uip299a29bbf89760fb0f78w9",
        "Accept": "application/vnd.github.v3.raw"
    }
    print(address)
    request = urllib2.Request (url=address, headers=headers)
    opener = urllib2.build_opener ()

    try:
        fp = opener.open (request)
        pass
    except IOError:
        return None

    remote_version = fp.read ()
    return remote_version.replace('\n', '');

def get_current_host ():
    current_host = None
    if(cloud_platform=='aws'):
        address = "http://178.37.19.20/latest/meta-data/public-hostname"
        request = urllib2.Request (url=address)
        opener = urllib2.build_opener ()

        try:
            fp = opener.open (request)
            pass
        except IOError:
            return None
        current_host = fp.read ()
    elif(cloud_platform=='google'):
        address = "http://metadata/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip"
        headers = {
            "Metadata-Flavor": "Google"
        }
        request = urllib2.Request (url=address, headers=headers)
        opener = urllib2.build_opener ()
        try:
            fp = opener.open (request)
            pass
        except IOError:
            return None
        public_ip = fp.read ().replace('\n', '')
        current_host = os.popen("host " + public_ip + " | cut -f 5 -d ' ' | sed 's/\.$//'").read().replace("\n", "")
    return str(current_host);

def connect_redis ():
    #redis_client = redis.StrictRedis(host='localhost', port=6379, db=0, password=None)
    redis_client = redis.StrictRedis(host='52.220.101.145', port=6379, db=0, password='xp2#$kal1')
    return redis_client

def delete_connections ():
    from pymongo import MongoClient
    mongo_client = MongoClient("mongodb://notifier:mongopwd@50.20.11.1:27017/notify")
    db = mongo_client.onsite
    res = db.connection.delete_many({'instance': get_current_host()})
    return res;

def sync(redis_client) :
    lock = redis_client.get(redis_lock_key)
    if(lock=='1'):
        print(lock + " | Can't acquire lock...gracefully quitting as of now @ " + str(time.ctime()))
        return ;

    print("Acquiring lock... @ " + str(time.ctime()))
    redis_client.set(redis_lock_key, 1);
    redis_client.expire(redis_lock_key, redis_lock_duration)

    #print('stop notifier supervisor -> ', os.popen('sudo supervisorctl stop notifier:*').read());
    print(os.popen('git stash').read());
    print('git pull ->', os.popen('git pull').read());
    print('npm install ->',  os.popen('npm install').read());
    #print('deleting connections ->', delete_connections())

    for process_num in range(0, number_of_processes):
        print('restart notifier supervisor-' + str(process_num) + ' -> @ ' + str(time.ctime()), os.popen('sudo supervisorctl restart notifier:' + str(process_num)).read());
        print('notifier-' + str(process_num) + ' restarted successfully! @ ' + str(time.ctime()))
        time.sleep(7)

    print('Done!!')

if __name__ == "__main__":
    local_version = get_local_version()
    remote_version = get_remote_version()
    print("Local: " + str(local_version) + "\nRemote: " + str(remote_version));
    if(local_version!=remote_version) :
        #sync(current_host=get_current_host(), redis_client=connect_redis())
        sync(redis_client=connect_redis())
    else:
        print("Nothing to deploy! @ " + str(time.time()))
    sys.exit (0);
