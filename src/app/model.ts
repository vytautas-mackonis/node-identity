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
        c['grants'] = ['password', 'refresh_token'];
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

interface UserSource {
    getUser(client: Client): Promise<maybe.Maybe<User>>;
}

class CredentialsUserSource implements UserSource {
    constructor(
        private userService: UserService,
        private hashAlgorithm: HashAlgorithm,
        private login: string,
        private password: string) {}

    public async getUser(client: Client) {
        const user = await this.userService.getByLogin(client.tenantId, this.login);
        if (user.isNothing) return user;
        const u = user.get();
        if (u.passwordHash && await this.hashAlgorithm.verifyHash(u.passwordHash, this.password)) {
            return maybe.Just(u);
        } else {
            return maybe.Nothing();
        }
    }
}

class IdUserSource implements UserSource {
    constructor(
        private userService: UserService,
        private tenantId: string,
        private id: string
    ) {}

    public async getUser(client: Client) {
        return await this.userService.getById(this.tenantId, this.id);
    }
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

    private makeRefreshToken = async (client, user) => {
        const now = +new Date();
        const tokenExpiration = Math.floor(now / 1000) + 15 * 60;

        const payload = {
            tenantId: client.tenantId,
            clientId: client.id,
            userId: user.id,
        };

        return await this.tokenProvider.sign(payload);
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

    public getUser = async (username: string, password: string) => {
        return new CredentialsUserSource(
            this.persistence.users,
            this.hashAlgorithm,
            username,
            password
        );
    }

    public saveToken = async (accessToken, client, userSource: UserSource) => {
        const user = await userSource.getUser(client);
        if (user.isNothing) {
            return {
                accessToken: 'invalid',
                client: client,
                user: 'invalid',
                validate: () => { throw new InvalidGrantError('Invalid username or password'); }
            };
        }

        const u = user.get();
        const claims = await this.persistence.users.claimsForUser(client.tenantId, u.id);
        const token = await this.generateAccessTokena(client, u, claims);
        const refreshToken = await this.makeRefreshToken(client, u);

        return {
            accessToken: token,
            refreshToken: refreshToken,
            client: client,
            user: u,
            validate: () => {}
        };
    }
    
    public getRefreshToken = async (token: string) => {
        let payload = await this.tokenProvider.verify<any>(token);
        let user = new IdUserSource(this.persistence.users, payload.tenantId, payload.userId);
        return {
            user: user,
            client: { id: payload.clientId },
            refreshTokenExpiresAt: new Date(payload.exp * 1000)
        };
    }

    public revokeToken = async (token) => {
        return true;
    }

    public async validateScope(user, client, scope) {
        return scope || true;
    }
}
