import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as nconf from 'nconf';
import { OAuthModel } from './model';
import * as tenants from './tenants';
import * as MongoOAuthPersistenceFactory from './mongoPersistence';


export async function start() {
    nconf.argv();
    nconf.file('conf/config.json');

    nconf.defaults({
        port: 3000
    });

    const persistence = await MongoOAuthPersistenceFactory.create(nconf.get('mongoDbUrl'));
    
    const app = express();
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
     
    const o = require('express-oauth-server');
    const oauth = new o({
        model: new OAuthModel() 
    });

    app.use('/token', oauth.token());

    tenants.configure(app, persistence.tenants);
     
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
        res.status(500).send({ error: 'Oops! Something went wrong!' });
    })
     
    let port = nconf.get('port');
    app.listen(port);
}
