import * as jwt from 'jsonwebtoken';
//nasty hack to be able to report a different error to server
const InvalidGrantError = require('express-oauth-server/node_modules/oauth2-server/lib/errors/invalid-grant-error');

const jwtSecret = 'secret';

interface Client {
    id: string;
    name: string;
    tenantId: string;
    applicationType: string;
    secret: string;
    secretSalt: string;
    allowedOrigin: string;
    active: boolean;
    refreshTokenPeriod: number;
    grants: string[]
}

async function getClient(clientId: string, clientSecret: string): Promise<Client> {
   if (clientId === 'node-identity-app' && clientSecret === 'db0ae3240e4f49abb38230fe52bafe13') 
    return {
        id: clientId,
        name: '',
        tenantId: '',
        applicationType: 'Confidential',
        secret: clientSecret,
        secretSalt: '',
        allowedOrigin: null,
        active: true,
        refreshTokenPeriod: 24 * 60 * 60 * 1000,
        grants: ['password']
    };
  return null;
}

interface User {
    id: string;
    tenantId: string;
    login: string;
    name: string;
    email: string;
    passwordHash: string;
    passwordSalt: string;
}

async function getUser(tenantId: string, login: string, password: string) {
    if (login === 'admin' && password === 'changeit')
        return {
            id: login,
            tenantId: '',
            login: login,
            name: login,
            email: 'admin@admin.lt',
            passwordHash: password,
            passwordSalt: password
        };

    return null;
}

interface Credentials {
    username: string;
    password: string;
}

export class OAuthModel {
    public generateAccessToken = async (client, user, scope) => {
        return 'generated';
    }
    public async getAccessToken(bearerToken) {
        console.log('getAccessToken, arguments:', bearerToken);

        return {
            accessToken: 'asdf',
            user: {
                id: 1,
                name: 'name',
                mail: 'asdsa@sadsa.com'
            },
            expires: null
        };
    }

    public async getClient(clientId: string, clientSecret: string) {
        console.log('getClient, arguments:', clientId, clientSecret);

        let client = await getClient(clientId, clientSecret);
        return client;
    }

    public async getUser(username: string, password: string) {
        console.log('getUser, arguments:', username, password);

        //dummy values because we don't have client here
        return {
            username: username,
            password: password
        };
    }

    public saveToken = async (accessToken, client, credentials: Credentials) => {
        console.log('saveToken, arguments:', accessToken, client, credentials);
        if (credentials.username !== 'admin' || credentials.password !== 'changeit') {
            throw new InvalidGrantError('Invalid username or password');
        }

        return {
            accessToken: 'access token',
            client: client,
            user: credentials
        };
    }

    public async validateScope(user, client, scope) {
        console.log('validateScope, arguments:', user, client, scope);

        return scope || true;
    }
}
