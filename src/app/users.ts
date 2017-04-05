import { Express } from 'express';
import * as _ from 'lodash';
import { UserService, User } from './persistence';
import { HashAlgorithm } from './hashAlgorithm';

interface UserRendition {
    id: string;
    tenantId: string;
    login: string;
    name: string;
    email: string;
}

export function configure(server: Express, repository: UserService, hashAlgorithm: HashAlgorithm) {
    function toRendition(user: User) {
        let copy = Object.assign({}, user);
        delete copy['passwordHash'];
        delete copy['passwordSalt'];
        return copy;
    }
    
    async function list() {
        let users = await repository.query({});
        return _.map(users, toRendition);
    }

    async function save(id: string, user: UserRendition) {
        return await repository.save(user.tenantId, user.id, user.login, user.email, user.name);
    }

    async function find(tenantId: string, id: string) {
        let client = await repository.getById(tenantId, id);
        return client.map(toRendition);
    }

    async function remove(tenantId: string, id: string) {
        return await repository.delete(tenantId, id);
    }

    async function setPassword(tenantId: string, userId: string, password: string) {
        const hash = await hashAlgorithm.computeHash(password);
        await repository.changePassword(tenantId, userId, hash);
    }

    server.put('/users/:id', (request, response, next) => {
        save(request.params.id, request.body)
            .then(created => {
                let statusCode = created ? 201: 200;
                response.status(statusCode).send();
            })
            .catch(e => next(e));
    });

    server.get('/users/:id', (request, response, next) => {
        find(request.query.tenantId, request.params.id)
            .then(result => result.map(x => {
                return { statusCode: 200, body: <any>x };
            }).getOrElse({ statusCode: 404, body: `Client with id ${request.params.id} not found`}))
            .then(result => response.status(result.statusCode).send(result.body))
            .catch(next);
    })

    server.get('/users', (request, response, next) => {
        list()
            .then(tenants => response.status(200).send(tenants))
            .catch(next);
    });

    server.delete('/users/:id', (request, response, next) => {
        remove(request.query.tenantId, request.params.id)
            .then(() => response.status(200).send())
            .catch(next);
    });

    server.put('/users/:id/password', (request, response, next) => {
        setPassword(request.query.tenantId, request.params.id, request.body.password)
            .then(() => response.status(200).send())
            .catch(next);
    });
}
