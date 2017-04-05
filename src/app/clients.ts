import { Express } from 'express';
import * as _ from 'lodash';
import { ClientSaveRequest, ClientService, Client } from './persistence';
import { HashAlgorithm } from './hashAlgorithm';

export function configure(server: Express, repository: ClientService, hashAlgorithm: HashAlgorithm) {
    function toRendition(client: Client) {
        let copy = Object.assign({}, client);
        delete copy['secretHash'];
        delete copy['tenantId'];
        return copy;
    }
    
    async function list(tenantId: string) {
        let clients = await repository.query({});
        return _.map(clients, toRendition);
    }

    async function save(tenantId: string, id: string, client: ClientSaveRequest) {
        client.tenantId = tenantId;
        client.secretHash = await hashAlgorithm.computeHash(client['secret']);
        delete client['secret'];
        return await repository.save(id, client);
    }

    async function find(tenantId: string, id: string) {
        let client = await repository.getById(id);
        return client.map(toRendition);
    }

    async function remove(tenantId: string, id: string) {
        return await repository.delete(id);
    }

    server.put('/admin/tenants/:tenantId/clients/:id', (request, response, next) => {
        save(request.params.tenantId, request.params.id, request.body)
            .then(created => {
                let statusCode = created ? 201: 200;
                response.status(statusCode).send();
            })
            .catch(e => next(e));
    });

    server.get('/admin/tenants/:tenantId/clients/:id', (request, response, next) => {
        find(request.params.tenantId, request.params.id)
            .then(result => result.map(x => {
                return { statusCode: 200, body: <any>x };
            }).getOrElse({ statusCode: 404, body: `Client with id ${request.params.id} not found`}))
            .then(result => response.status(result.statusCode).send(result.body))
            .catch(next);
    })

    server.get('/admin/tenants/:tenantId/clients', (request, response, next) => {
        list(request.params.tenantId)
            .then(tenants => response.status(200).send(tenants))
            .catch(next);
    });

    server.delete('/admin/tenants/:tenantId/clients/:id', (request, response, next) => {
        remove(request.params.tenantId, request.params.id)
            .then(() => response.status(200).send())
            .catch(next);
    });
}
