#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export MODE='PRODUCTION'

python logwriter.py write 
