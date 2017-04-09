#!/usr/bin/env bash
ssh-keygen -f key.rsa -t rsa -N ''
rm key.rsa.pub
openssl rsa -in key.rsa -pubout -outform PEM -out key.rsa.pub
sed -E ':a;N;$!ba;s/\r{0,1}\n/\\n/g' key.rsa > key.rsa.tmp && mv key.rsa.tmp key.rsa
sed -E ':a;N;$!ba;s/\r{0,1}\n/\\n/g' key.rsa.pub > key.rsa.pub.tmp && mv key.rsa.pub.tmp key.rsa.pub
