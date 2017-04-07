import { Express, Request } from 'express';
import * as promisify from './promisify';
import * as _ from 'lodash';
import * as maybe from 'data.maybe';
import { ClientService, Client } from './persistence';
import { HashAlgorithm } from './hashAlgorithm';

export function configure(server: Express, repository: ClientService, hashAlgorithm: HashAlgorithm) {
    function toRendition(client: Client) {
        let copy = Object.assign({}, client);
        delete copy['secretHash'];
        delete copy['tenantId'];
        return copy;
    }
    
    async function list(tenantId: string) {
        const clients = await repository.query({ tenantId: tenantId });
        const body = _.map(clients, toRendition);
        return { statusCode: 200, body: body };
    }

    async function save(tenantId: string, id: string, client: Client) {
        client.tenantId = tenantId;
        client.secretHash = await hashAlgorithm.computeHash(client['secret']);
        delete client['secret'];
        const created = await repository.save(id, client);
        return { statusCode: created ? 201 : 200 };
    }

    async function find(tenantId: string, id: string) {
        const client = await repository.getById(id);
        return client.chain(x => { 
                return x.tenantId === tenantId ? maybe.Just(x): maybe.Nothing<Client>();
            }).map(toRendition)
            .map(x => { return { statusCode: 200, body: <any>x }; })
            .getOrElse({ statusCode: 404, body: `Client with id ${id} not found.` });
    }

    async function remove(tenantId: string, id: string) {
        await repository.delete(id);
        return { statusCode: 200 };
    }

    server.put('/admin/tenants/:tenantId/clients/:id', 
        promisify.expressHandler(req =>
            save(req.params.tenantId, req.params.id, req.body)
        )
    );

    server.get('/admin/tenants/:tenantId/clients/:id',
        promisify.expressHandler(req =>
            find(req.params.tenantId, req.params.id)
        )
    );

    server.get('/clients/:id',
        promisify.expressHandler((req, resp) => {
            return find(resp.locals.oauth.user.tenantId, req.params.id);
        }
        )
    );

    server.get('/admin/tenants/:tenantId/clients',
        promisify.expressHandler(req =>
            list(req.params.tenantId)
        )
    );

    server.get('/clients',
        promisify.expressHandler((req, resp) =>
            list(resp.locals.oauth.user.tenantId)
        )
    );

    server.delete('/admin/tenants/:tenantId/clients/:id',
        promisify.expressHandler(req =>
            remove(req.params.tenantId, req.params.id)
        )
    );
}
