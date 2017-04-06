import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as nconf from 'nconf';
import { OAuthModel } from './model';
import * as tenants from './tenants';
import * as clients from './clients';
import * as users from './users';
import * as claims from './claims';
import * as MongoOAuthPersistenceFactory from './persistence/mongo/index';
import { Argon2HashAlgorithm } from './argon2HashAlgorithm';
const o = require('express-oauth-server');


let configured = false;
let server = null;

export async function start() {
    if (!configured) {
        configured = true;
        
nconf.argv();
nconf.file('conf/config.json');

nconf.defaults({
    port: 3000
});
    }
    const persistence = await MongoOAuthPersistenceFactory.create(nconf.get('mongoDbUrl'));
    await persistence.initializer.initialize();

    const hashAlgorithm = new Argon2HashAlgorithm();
    
    const app = express();
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
     
    const oauth = new o({
        model: new OAuthModel(persistence, hashAlgorithm) 
    });

    app.use('/token', oauth.token());
    app.use(oauth.authenticate());

    tenants.configure(app, persistence.tenants);
    clients.configure(app, persistence.clients, hashAlgorithm);
    users.configure(app, persistence.users, hashAlgorithm);
    claims.configure(app, persistence.users);
     
    app.use((req, res, next) => {
        res.status(404);

        // respond with json
        if (req.accepts('json')) {
            res.send({ error: 'Not found' });
            return;
        }

        // default to plain-text. send()
        res.type('txt').send('Not found');
    })

    app.use((err, req, res, next) => {
        console.error(err);
        res.status(500).send({ error: 'Oops! Something went wrong!' });
    })
     
    let port = nconf.get('port');
    server = app.listen(port);
}

export function stop() {
    if (server) server.close();
}
