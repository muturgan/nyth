#!/bin/bash

for package in $(ls packages); do
    npm run build \-w @nyth/$package

    if [ $? != 0 ]; then
        exit $?
    fi
done
