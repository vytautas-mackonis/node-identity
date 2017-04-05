import * as jwt from 'jsonwebtoken';
import * as maybe from 'data.maybe';
import { OAuthPersistence, ClientService, Client, UserService, User } from './persistence';
import { HashAlgorithm } from './hashAlgorithm';
//nasty hack to be able to report a different error to server
const InvalidGrantError = require('express-oauth-server/node_modules/oauth2-server/lib/errors/invalid-grant-error');

const jwtSecret = 'secret';

async function getClient(clientService: ClientService, hashAlgorithm: HashAlgorithm, clientId: string, clientSecret: string): Promise<Client> {
    const client = await clientService.getById(clientId);
    if (client.isNothing) return null;
    const c = client.get();
    if (await hashAlgorithm.verifyHash(c.secretHash, clientSecret)) {
        c['grants'] = ['password'];
        return c;
    } 

    return null;
}

async function getUser(userService: UserService, hashAlgorithm: HashAlgorithm, tenantId: string, login: string, password: string): Promise<maybe.Maybe<User>> {
    const user = await userService.getByLogin(tenantId, login);
    if (user.isNothing) return user;
    const u = user.get();
    if (u.passwordHash && await hashAlgorithm.verifyHash(u.passwordHash, password)) {
        return maybe.Just(u);
    } else {
        return maybe.Nothing();
    }
}

interface Credentials {
    username: string;
    password: string;
}

export class OAuthModel {
    constructor(private persistence: OAuthPersistence, private hashAlgorithm: HashAlgorithm) { }

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

    public getClient = async (clientId: string, clientSecret: string) => {
        console.log('getClient, arguments:', clientId, clientSecret);

        let client = await getClient(this.persistence.clients, this.hashAlgorithm, clientId, clientSecret);
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
        const user = await getUser(this.persistence.users, this.hashAlgorithm, client.tenantId, credentials.username, credentials.password);
        if (user.isNothing) {
            throw new InvalidGrantError('Invalid username or password');
        }

        return {
            accessToken: 'access token',
            client: client,
            user: user.get()
        };
    }

    public async validateScope(user, client, scope) {
        console.log('validateScope, arguments:', user, client, scope);

        return scope || true;
    }
}
