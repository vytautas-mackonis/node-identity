#!/usr/bin/env bash
set -e
npm install
gulp test
node_modules/node-deb/node-deb \
    --template-postrm tools/node-deb/postrm.template \
    --template-postinst tools/node-deb/postinst.template \
    --install-strategy npm-install \
    -o node-identity.deb \
    -- conf dist/app
