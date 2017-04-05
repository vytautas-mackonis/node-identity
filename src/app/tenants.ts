import { Express } from 'express';
import { TenantService } from './persistence';

export function configure(server: Express, repository: TenantService) {
    interface TenantSaveRequest {
        name: string;
    }

    async function listTenants() {
        return await repository.query({});
    }

    async function saveTenant(id: string, tenant: TenantSaveRequest) {
        return await repository.save({
            id: id,
            name: tenant.name
        });
    }

    async function getTenant(id: string) {
        return await repository.getById(id);
    }

    async function deleteTenant(id: string) {
        return await repository.delete(id);
    }

    server.put('/admin/tenants/:id', (request, response, next) => {
        saveTenant(request.params.id, request.body)
            .then(created => {
                let statusCode = created ? 201: 200;
                response.status(statusCode).send();
            })
            .catch(e => next(e));
    });

    server.get('/admin/tenants/:id', (request, response, next) => {
        getTenant(request.params.id)
            .then(result => result.map(x => {
                return { statusCode: 200, body: <any>x };
            }).getOrElse({ statusCode: 404, body: `Tenant with id ${request.params.id} not found`}))
            .then(result => response.status(result.statusCode).send(result.body))
            .catch(next);
    })

    server.get('/admin/tenants', (request, response, next) => {
        listTenants()
            .then(tenants => response.status(200).send(tenants))
            .catch(next);
    });

    server.delete('/admin/tenants/:id', (request, response, next) => {
        deleteTenant(request.params.id)
            .then(() => response.status(200).send())
            .catch(next);
    });
}
