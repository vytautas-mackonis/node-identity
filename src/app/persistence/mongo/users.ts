import { User, UserFilter, UserService }from '../../persistence';
import * as maybe from 'data.maybe';
import * as _ from 'lodash';

import { Db, Collection } from 'mongodb';

interface UserDocument {
    userId: string;
    tenantId: string;
    login: string;
    loginLowercase: string;
    name: string;
    email: string;
    passwordHash: string;
    passwordSalt: string;
    passwordResetToken: string;
    version: number;
}

function toDocument(user: User): UserDocument {
    return {
        userId: user.id,
        tenantId: user.tenantId,
        login: user.login,
        loginLowercase: user.login.toLowerCase(),
        name: user.name,
        email: user.email.toLowerCase(),
        passwordHash: user.passwordHash,
        passwordSalt: user.passwordSalt,
        version: 0,
        passwordResetToken: null
    };
}

function fromDocument(user: UserDocument): User {
    return {
        id: user.userId,
        tenantId: user.tenantId,
        login: user.login,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        passwordSalt: user.passwordSalt
    };
}

function arrayToMaybe<T>(arr: T[]) : maybe.Maybe<T> {
    if (arr.length === 0)
        return maybe.Nothing<T>();

    return maybe.Just(arr[0]);
}

export class MongoUserService implements UserService {
    private users: Collection;
    constructor(db: Db) {
        this.users = db.collection('users');
    }

    public async query(filter: UserFilter) {
        let q: any = {};
        if (filter.login && _.isString(filter.login))
            q.loginLowercase = filter.login.toLowerCase();
        if (filter.tenantId && _.isString(filter.tenantId))
            q.tenantId = filter.tenantId;
        if (filter.userId && _.isString(filter.userId))
            q.userId = filter.userId;
        if (filter.email && _.isString(filter.email))
            q.email = filter.email;

        return await this.users.find<User>(q)
            .map(fromDocument)
            .toArray();
    }

    public async getById(tenantId: string, id: string) {
        return arrayToMaybe(await this.query({ tenantId: tenantId, userId: id }));
    }

    public async getByEmail(tenantId: string, email: string) {
        return arrayToMaybe(await this.query({ tenantId: tenantId, email: email }));
    }

    public async getByEmailAndLogin(tenantId: string, email: string, login: string) {
        return arrayToMaybe(await this.query({ tenantId: tenantId, email: email, login: login }));
    }

    public async getByLoginAndPassword(tenantId: string, login: string, passwordAttempt: string) {
        return maybe.Nothing<User>();
    }

    public async getByPasswordResetToken(token: string) {
        return maybe.Nothing<User>();
    }

    public async save(tenantId: string, id: string, login: string, email: string, name: string) {
        let doc = {
            tenantId: tenantId,
            userId: id,
            login: login,
            loginLowercase: login.toLowerCase(),
            email: email.toLowerCase(),
            name: name
        };

        let saveResult = await this.users.update({ tenantId: tenantId, userId: id }, doc, { upsert: true });
        return saveResult.result.upserted && saveResult.result.upserted.length > 0;
    }

    public async changePassword(tenantId: string, id: string, password: string) {

    }

    public async delete(tenantId: string, id: string) {
        await this.users.remove({ tenantId: tenantId, userId: id });
    }
}
