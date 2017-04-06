import { Express } from 'express';
import * as _ from 'lodash';
import { UserService, User } from './persistence';
import * as promisify from './promisify';

interface ClaimSaveRequest {
    value: string;
}

export function configure(server: Express, repository: UserService) {
    async function list(tenantId: string, userId: string) {
        const claims = await repository.claimsForUser(tenantId, userId);
        return { statusCode: 200, body: claims };
    }

    async function save(tenantId: string, userId: string, key: string, claim: ClaimSaveRequest) {
        const created = await repository.setUserClaim(tenantId, userId, {
            key: key,
            value: claim.value
        });
        return { statusCode: created ? 201 : 200 };
    }

    async function find(tenantId: string, userId: string, key: string) {
        let claims = await repository.claimsForUser(tenantId, userId);
        let claim = _.find(claims, x => x.key === key);
        if (claim)
            return { statusCode: 200, body: claim };
        return { statusCode: 404, body: `User with id ${userId} does not have a claim ${key}` };
    }

    async function remove(tenantId: string, userId: string, key: string) {
        await repository.removeUserClaim(tenantId, userId, key);
        return { statusCode: 200 };
    }

    server.put('/admin/tenants/:tenantId/users/:userId/claims/:key', 
        promisify.expressHandler(req =>
            save(req.params.tenantId, req.params.userId, req.params.key, req.body)
        )
    );

    server.get('/admin/tenants/:tenantId/users/:userId/claims/:key',
        promisify.expressHandler(req =>
            find(req.params.tenantId, req.params.userId, req.params.key)
        )
    );

    server.get('/admin/tenants/:tenantId/users/:userId/claims',
        promisify.expressHandler(req => list(req.params.tenantId, req.params.userId))
    );

    server.delete('/admin/tenants/:tenantId/users/:userId/claims/:key',
        promisify.expressHandler(req =>
            remove(req.params.tenantId, req.params.userId, req.params.key)
        )
    );
}
