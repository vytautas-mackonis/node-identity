import * as jwt from 'jsonwebtoken';
import * as maybe from 'data.maybe';
import * as _ from 'lodash';
import { OAuthPersistence, ClientService, Client, UserService, User } from './persistence';
import { HashAlgorithm } from './hashAlgorithm';
import { TokenProvider } from './token';
const InvalidGrantError = require('oauth2-server/lib/errors/invalid-grant-error');

async function getClient(clientService: ClientService, hashAlgorithm: HashAlgorithm, clientId: string, clientSecret: string): Promise<Client> {
    const client = await clientService.getById(clientId);
    if (client.isNothing) return null;
    const c = client.get();
    if (!c.active) return null;
    if (c.applicationType == 'Public' || await hashAlgorithm.verifyHash(c.secretHash, clientSecret)) {
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
    constructor(
        private persistence: OAuthPersistence,
        private hashAlgorithm: HashAlgorithm,
        private tokenProvider: TokenProvider) { }

    public generateAccessTokena = async (client, user, claims) => {
        const tokenPayload = _(claims)
            .keyBy(x => x.key)
            .mapValues((x:any) => x.value)
            .value();

        tokenPayload['ni:tenantId'] = client.tenantId;
        tokenPayload['ni:login'] = user.login;
        tokenPayload['ni:userId'] = user.id;

        return await this.tokenProvider.sign(tokenPayload);
    }

    public getAccessToken = async (bearerToken) => {
        const payload = await this.tokenProvider.verify<any>(bearerToken);
        const user = await this.persistence.users.getById(payload['ni:tenantId'], payload['ni:userId']);
        if (user.isNothing)
            return null;

        return {
            user: user.get(),
            accessTokenExpiresAt: new Date(payload.exp * 1000)
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
        const u = user.get();
        const claims = await this.persistence.users.claimsForUser(client.tenantId, u.id);
        const token = await this.generateAccessTokena(client, u, claims);

        return {
            accessToken: token,
            client: client,
            user: u
        };
    }

    public async validateScope(user, client, scope) {
        return scope || true;
    }
}
