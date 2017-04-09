npm install
gulp test
node_modules/node-deb/node-deb \
    --template-postrm tools/node-deb/postrm.template \
    --install-strategy npm-install \
    -o node-identity.deb \
    -- conf dist/app
