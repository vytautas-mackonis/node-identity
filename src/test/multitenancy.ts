import * as api from './infrastructure/api';
import * as urls from './infrastructure/urls';
import * as httpAssert from './infrastructure/httpAssert';
import { expect } from 'chai';
import * as uuid from 'node-uuid';

describe('After registering a tenant', () => {
    const tenant1 = {
        id: uuid.v4(),
        name: uuid.v4()
    };

    const client1 = {
        id: uuid.v4(),
        name: uuid.v4(),
        tenantId: tenant1.id,
        applicationType: 'Confidential',
        allowedOrigin: uuid.v4(),
        active: Math.random() > 0.5,
        refreshTokenLifetime: Math.round(Math.random() * 10000)
    };

    const user1 = {
        id: uuid.v4(),
        tenantId: tenant1.id,
        login: uuid.v4(),
        name: uuid.v4(),
        email: uuid.v4() + '@' + uuid.v4() + '.com'
    };

    const tenant2 = {
        id: uuid.v4(),
        name: uuid.v4()
    };
    
    const client2 = {
        id: uuid.v4(),
        name: uuid.v4(),
        tenantId: tenant2.id,
        applicationType: 'Confidential',
        allowedOrigin: uuid.v4(),
        active: Math.random() > 0.5,
        refreshTokenLifetime: Math.round(Math.random() * 10000)
    };

    const user2 = {
        id: uuid.v4(),
        tenantId: tenant2.id,
        login: uuid.v4(),
        name: uuid.v4(),
        email: uuid.v4() + '@' + uuid.v4() + '.com'
    };

    before(async () => {
        await api.dropDatabase();
        let client = await api.defaultAdminClient();
        let response = await client.putJson(urls.tenant(tenant1.id), {
            name: tenant1.name
        });
        httpAssert.expectStatusCode(response, 201);
    });

});
