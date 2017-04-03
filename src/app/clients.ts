import { Express } from 'express';
import * as _ from 'lodash';
import { ClientSaveRequest, ClientService, Client } from './persistence';

export function configure(server: Express, repository: ClientService) {
    function toRendition(client: Client) {
        let copy = Object.assign({}, client);
        delete copy['secret'];
        delete copy['secretSalt'];
        return copy;
    }
    
    async function list() {
        let clients = await repository.query({});
        return _.map(clients, toRendition);
    }

    async function save(id: string, client: ClientSaveRequest) {
        return await repository.save(id, client);
    }

    async function find(id: string) {
        let client = await repository.getById(id);
        return client.map(toRendition);
    }

    async function remove(id: string) {
        return await repository.delete(id);
    }

    server.put('/clients/:id', (request, response, next) => {
        save(request.params.id, request.body)
            .then(created => {
                let statusCode = created ? 201: 200;
                response.status(statusCode).send();
            })
            .catch(e => next(e));
    });

    server.get('/clients/:id', (request, response, next) => {
        find(request.params.id)
            .then(result => result.map(x => {
                return { statusCode: 200, body: <any>x };
            }).getOrElse({ statusCode: 404, body: `Client with id ${request.params.id} not found`}))
            .then(result => response.status(result.statusCode).send(result.body))
            .catch(next);
    })

    server.get('/clients', (request, response, next) => {
        list()
            .then(tenants => response.status(200).send(tenants))
            .catch(next);
    });

    server.delete('/clients/:id', (request, response, next) => {
        remove(request.params.id)
            .then(() => response.status(200).send())
            .catch(next);
    });
}
