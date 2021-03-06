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
import * as _ from 'lodash';
import { ExpressOAuthServer } from './express-oauth2';
import { corsHandler } from './cors';
import { JwtTokenProvider } from './jwt';

let server = null;

export async function start() {
    nconf.argv();
    nconf.file('conf/config.json');

    nconf.defaults({
        port: 3000,
        allowedOrigin: '*',
        argon2TimeCost: 3,
        argon2MemoryCost: 14,
        argon2Parallelism: 1,
        accessTokenExpirationSeconds: 10 * 60,
        refreshTokenExpirationSeconds: 60 * 60
    });

    const mongoDbUrl = `mongodb://${nconf.get('mongoHost')}:${nconf.get('mongoPort')}/${nconf.get('mongoDatabase')}`;
    const persistence = await MongoOAuthPersistenceFactory.create(mongoDbUrl);
    await persistence.initializer.initialize();

    const hashAlgorithm = new Argon2HashAlgorithm({
        timeCost: nconf.get('argon2TimeCost'),
        memoryCost: nconf.get('argon2MemoryCost'),
        parallelism: nconf.get('argon2Parallelism')
    });

    const tokenProvider = new JwtTokenProvider({
        privateKey: nconf.get('jwtPrivateKey'),
        publicKey: nconf.get('jwtPublicKey')
    });

    const app = express();
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    const oauth = new ExpressOAuthServer({ 
        model: new OAuthModel(
            persistence,
            hashAlgorithm,
            tokenProvider,
            nconf.get('accessTokenExpirationSeconds'),
            nconf.get('refreshTokenExpirationSeconds')
        )
    });

    const allowedOrigin = nconf.get('allowedOrigin');
    const cors = corsHandler(allowedOrigin);
    app.options('*', cors.preflight);
    app.use('/token', oauth.token(cors.clientHandler));
    app.use(cors.postflight);
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
