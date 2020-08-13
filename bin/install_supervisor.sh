#!/bin/bash 
BINDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PORJECTROOT="$(dirname "$BINDIR")"

echo $BINDIR
echo $PORJECTROOT

cat > notifier_supervisord_prod.conf << EOF1
[program:notifier]
command=/bin/bash $BINDIR/notifier.sh %(process_num)02d
numprocs=4
process_name=%(process_num)s
directory=$PORJECTROOT
autostart=true
autorestart=true
user=$USER
group=$USER
stdout_logfile=$PORJECTROOT/var/logs/notifier.log
redirect_stderr=true
environment=LANG=en_US.UTF-8,LC_ALL=en_US.UTF-8
stopwaitsecs=10
EOF1

sudo mv notifier_supervisord_prod.conf /etc/supervisor/conf.d/

sudo rm /etc/nginx/sites-enabled/notifier_nginx.conf
sudo ln -s $BINDIR/conf/notifier_nginx.conf /etc/nginx/sites-enabled/notifier_nginx.conf

sudo supervisorctl reload
sudo supervisorctl restart notifier:*