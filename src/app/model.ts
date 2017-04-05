import * as jwt from 'jsonwebtoken';
import * as maybe from 'data.maybe';
import { OAuthPersistence, ClientService, Client, UserService, User } from './persistence';
import { HashAlgorithm } from './hashAlgorithm';
//nasty hack to be able to report a different error to server
const InvalidGrantError = require('express-oauth-server/node_modules/oauth2-server/lib/errors/invalid-grant-error');

const jwtSecret = 'secret';

function jwtSign(payload: any) : Promise<string> {
    return new Promise((resolve, reject) => {
        jwt.sign(payload, jwtSecret, {}, (err, token) => {
            if (err) {
                reject(err);
            } else {
                resolve(token);
            }
        });
    });
}

function jwtVerify<T>(token: string) : Promise<T> {
    return new Promise((resolve, reject) => {
        jwt.verify(token, jwtSecret, {}, (err, payload) => {
            if (err) {
                reject(err);
            } else {
                resolve(payload);
            }
        });
    });
}

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
        const tokenPayload = {
            'ni:tenantId': client.tenantId,
            'ni:login': user.login,
            'ni:userId': user.id
        };

        return await jwtSign(tokenPayload);
    }

    public getAccessToken = async (bearerToken) => {
        const payload = await jwtVerify<any>(bearerToken);
        const user = await this.persistence.users.getById(payload['ni:tenantId'], payload['ni:userId']);
        if (user.isNothing)
            return null;
        return {
            user: user.get(),
            expires: payload.exp
        };
    }

    public getClient = async (clientId: string, clientSecret: string) => {
        let client = await getClient(this.persistence.clients, this.hashAlgorithm, clientId, clientSecret);
        return client;
    }

    public async getUser(username: string, password: string) {
        //dummy values because we don't have client here
        return {
            username: username,
            password: password
        };
    }

    public saveToken = async (accessToken, client, credentials: Credentials) => {
        const user = await getUser(this.persistence.users, this.hashAlgorithm, client.tenantId, credentials.username, credentials.password);
        if (user.isNothing) {
            throw new InvalidGrantError('Invalid username or password');
        }

        return {
            accessToken: accessToken.accessToken,
            client: client,
            user: user.get()
        };
    }

    public async validateScope(user, client, scope) {
        return scope || true;
    }
}
