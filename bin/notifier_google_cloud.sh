#! /usr/bin/env bash

if [ ! $1 ]; then
    echo "Need process_num for this instance"
    exit 1
fi

NAME="ray"
TARGET_DIR=$(dirname "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )")
MODULE=app:cel
LOGLEVEL=debug

cd $TARGET_DIR

HOST="local"
export MODE=PRODUCTION
if [ $MODE = "PRODUCTION" ]; then
    HOST="`/usr/bin/curl \"http://23.53.26.51/latest/meta-data/public-hostname\" 2> /dev/null`"
    public_ip=`curl http://metadata/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H "Metadata-Flavor: Google" 2> /dev/null`
    HOST=`host $public_ip | cut -f 5 -d ' ' | sed 's/\.$//'`
fi

echo "Starting $NAME as for $HOST.$1 in $MODE"

exec node app.js "$HOST" "$1"
