import { Express } from 'express';
import * as _ from 'lodash';
import { UserService, User, DuplicateLoginError, DuplicateEmailError } from './persistence';
import { HashAlgorithm } from './hashAlgorithm';
import * as promisify from './promisify';

interface UserRendition {
    id: string;
    login: string;
    name: string;
    email: string;
}

export function configure(server: Express, repository: UserService, hashAlgorithm: HashAlgorithm) {
    function toRendition(user: User) {
        let copy = Object.assign({}, user);
        delete copy['passwordHash'];
        delete copy['tenantId'];
        return copy;
    }
    
    async function list(tenantId: string) {
        let users = await repository.query({ tenantId: tenantId });
        return { statusCode: 200, body: _.map(users, toRendition) };
    }

    async function save(tenantId: string, id: string, user: UserRendition) {
        try {
            const created = await repository.save(tenantId, user.id, user.login, user.email, user.name);
            return { statusCode: created ? 201 : 200 };
        } catch (e) {
            if (e instanceof DuplicateLoginError) {
                return { statusCode: 409, body: { message: `A user with login '${user.login}' already exists.` } };
            }
            if (e instanceof DuplicateEmailError) {
                return { statusCode: 409, body: { message: `A user with email '${user.email}' already exists.` } };
            }
            throw e;
        }
    }

    async function find(tenantId: string, id: string) {
        let user = await repository.getById(tenantId, id);
        return user.map(toRendition)
            .map(x => { return { statusCode: 200, body: <any>x }})
            .getOrElse({ statusCode: 404, body: `User with id ${id} not found`});
    }

    async function remove(tenantId: string, id: string) {
        await repository.delete(tenantId, id);
        return { statusCode: 200 };
    }

    async function setPassword(tenantId: string, userId: string, password: string) {
        const hash = await hashAlgorithm.computeHash(password);
        await repository.changePassword(tenantId, userId, hash);
        return { statusCode: 200 };
    }

    server.put('/admin/tenants/:tenantId/users/:id', 
        promisify.expressHandler(req =>
            save(req.params.tenantId, req.params.id, req.body)
        )
    );

    server.get('/admin/tenants/:tenantId/users/:id',
        promisify.expressHandler(req =>
            find(req.params.tenantId, req.params.id)
        )
    );

    server.get('/users/:id',
        promisify.expressHandler((req, resp) =>
            find(resp.locals.oauth.user.tenantId, req.params.id)
        )
    );

    server.get('/admin/tenants/:tenantId/users',
        promisify.expressHandler(req => list(req.params.tenantId))
    );

    server.get('/users',
        promisify.expressHandler((req, resp) => list(resp.locals.oauth.user.tenantId))
    );

    server.delete('/admin/tenants/:tenantId/users/:id',
        promisify.expressHandler(req =>
            remove(req.params.tenantId, req.params.id)
        )
    );

    server.put('/admin/tenants/:tenantId/users/:id/password',
        promisify.expressHandler(req =>
            setPassword(req.params.tenantId, req.params.id, req.body.password)
        )
    );
}
