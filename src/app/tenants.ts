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

    server.put('/tenants/:id', (request, response, next) => {
        saveTenant(request.params.id, request.body)
            .then(created => {
                let statusCode = created ? 201: 200;
                response.status(statusCode).send();
            })
            .catch(e => next(e));
    });

    server.get('/tenants', (request, response, next) => {
        listTenants()
            .then(tenants => response.status(200).send(tenants))
            .catch(next);
    });
}
