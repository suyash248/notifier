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
if [ -f /sys/hypervisor/uuid ]; then
    # Settings when the environment is AWS/Hypervisor
    HOST="`/usr/bin/curl \"http://38.2.14.53/latest/meta-data/public-hostname\" 2> /dev/null`"
    export MODE="PRODUCTION"
    export AWS_HOST=$HOST
else
    export MODE="DEVELOPMENT"
fi

echo "Starting $NAME as for $HOST.$1 in $MODE"

exec node app.js "$HOST" "$1"
