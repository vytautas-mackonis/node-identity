import * as api from './infrastructure/api';
import * as urls from './infrastructure/urls';
import * as httpAssert from './infrastructure/httpAssert';
import { expect } from 'chai';
import * as uuid from 'node-uuid';
import * as _ from 'lodash';
import * as settings from './infrastructure/settings';

interface Tenant {
    id: string;
    name: string;
}

function assertTenant(tenant: Tenant) {
    it('Should list tenant by admin', async () => {
        let client = await api.defaultAdminClient();
        let response = await client.getJson(urls.tenants());
        httpAssert.expectStatusCode(response, 200);
        let tenants = response.body;
        _.remove(tenants, t => t.id == settings.adminTenant);

        expect(tenants).to.eql([
            tenant
        ]);
    });

    it('Should get tenant by id using admin user', async () => {
        let client = await api.defaultAdminClient();
        let response = await client.getJson(urls.tenant(tenant.id));
        httpAssert.expectStatusCode(response, 200);
        expect(response.body).to.eql(tenant);
    });
}

describe('Tenant registration', () => {
    describe('After registering a tenant', () => {
        const tenant = {
            id: uuid.v4(),
            name: uuid.v4()
        };

        before(async () => {
            await api.dropDatabase();
            let client = await api.defaultAdminClient();
            let response = await client.putJson(urls.tenant(tenant.id), {
                name: tenant.name
            });
            httpAssert.expectStatusCode(response, 201);
        });

        assertTenant(tenant);
    });

    describe('After registering and updating a tenant', () => {
        const tenant = {
            id: uuid.v4(),
            name: uuid.v4()
        };

        before(async () => {
            await api.dropDatabase();
            let client = await api.defaultAdminClient();
            let response = await client.putJson(urls.tenant(tenant.id), {
                name: uuid.v4()
            });
            httpAssert.expectStatusCode(response, 201);
            response = await client.putJson(urls.tenant(tenant.id), { name: tenant. name });
            httpAssert.expectStatusCode(response, 200);
        });

        assertTenant(tenant);
    });

    describe('After registering two tenants and deleting one', () => {
        const tenant = {
            id: uuid.v4(),
            name: uuid.v4()
        };

        const deleted = {
            id: uuid.v4(),
            name: uuid.v4()
        };

        before(async () => {
            await api.dropDatabase();
            let client = await api.defaultAdminClient();
            let response = await client.putJson(urls.tenant(tenant.id), {
                name: tenant.name
            });
            httpAssert.expectStatusCode(response, 201);
            response = await client.putJson(urls.tenant(deleted.id), {
                name: deleted.name
            });
            httpAssert.expectStatusCode(response, 201);
            response = await client.delete(urls.tenant(deleted.id));
            httpAssert.expectStatusCode(response, 200);
        });

        assertTenant(tenant);

        it('Should not get deleted tenant by id using admin user', async () => {
            let client = await api.defaultAdminClient();
            let response = await client.getJson(urls.tenant(deleted.id));
            httpAssert.expectStatusCode(response, 404);
        });
    });
});
