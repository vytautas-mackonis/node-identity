import * as api from './infrastructure/api';
import * as urls from './infrastructure/urls';
import * as httpAssert from './infrastructure/httpAssert';
import { expect } from 'chai';
import * as uuid from 'node-uuid';

describe('Tenant registration', () => {
    const tenant1 = {
        id: uuid.v4(),
        name: uuid.v4()
    };

    beforeEach(async () => {
        let client = await api.defaultAdminClient();
        let response = await client.putJson(urls.tenant(tenant1.id), {
            name: tenant1.name
        });
        httpAssert.expectStatusCode(response, 201);
    });

    it('Should list tenant by admin', async () => {
        let client = await api.defaultAdminClient();
        let response = await client.getJson(urls.tenants());
        httpAssert.expectStatusCode(response, 200);
        let tenants = response.body;
        expect(tenants).to.eql([
            tenant1
        ]);
    })
});
