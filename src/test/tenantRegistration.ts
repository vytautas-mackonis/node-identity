import * as api from './infrastructure/api';
import * as urls from './infrastructure/urls';
import * as httpAssert from './infrastructure/httpAssert';
import { expect } from 'chai';
import * as uuid from 'node-uuid';
import * as _ from 'lodash';
import * as settings from './infrastructure/settings';
import * as data from './infrastructure/data';

function assertTenant(tenant: data.Tenant) {
    it('Should list tenant with admin user', async () => {
        let client = await api.defaultAdminClient();
        let response = await client.getJson(urls.tenants());
        httpAssert.expectStatusCode(response, 200);
        let tenants = response.body;
        _.remove<any>(tenants, t => t.id == settings.adminTenant);

        expect(tenants).to.eql([
            tenant
        ]);
    });

    it('Should get tenant by id with admin user', async () => {
        let client = await api.defaultAdminClient();
        let response = await client.getJson(urls.tenant(tenant.id));
        httpAssert.expectStatusCode(response, 200);
        expect(response.body).to.eql(tenant);
    });
}

describe('Tenant registration', () => {
    const tenant = data.randomTenant();
    
    describe('After registering a tenant', () => {
        before(async () => {
            await api.reset();
            let client = await api.defaultAdminClient();
            let response = await client.putJson(urls.tenant(tenant.id), {
                name: tenant.name
            });
            httpAssert.expectStatusCode(response, 201);
        });

        assertTenant(tenant);
    });

    describe('After registering and updating a tenant', () => {
        before(async () => {
            await api.reset();
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
        const deleted = data.randomTenant();

        before(async () => {
            await api.reset();
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

        it('Should not get deleted tenant by id with admin user', async () => {
            let client = await api.defaultAdminClient();
            let response = await client.getJson(urls.tenant(deleted.id));
            httpAssert.expectStatusCode(response, 404);
        });
    });
});
