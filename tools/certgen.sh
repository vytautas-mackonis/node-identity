#!/usr/bin/env bash
ssh-keygen -f key.rsa -t rsa -N ''
rm key.rsa.pub
openssl rsa -in key.rsa -pubout -outform PEM -out key.rsa.pub
