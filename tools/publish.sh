#!/bin/bash

for package in $(ls packages); do
    npm publish \-w @nyth/$package

    if [ $? != 0 ]; then
        exit $?
    fi
done
