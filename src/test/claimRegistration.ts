import * as api from './infrastructure/api';
import * as urls from './infrastructure/urls';
import * as httpAssert from './infrastructure/httpAssert';
import { expect } from 'chai';
import * as uuid from 'node-uuid';
import * as _ from 'lodash';
import * as settings from './infrastructure/settings';
import * as data from './infrastructure/data';

function assertClaim(tenantId: string, userId: string, claim: data.Claim) {
    it('Should list claim using admin api with admin user', async () => {
        let http = await api.defaultAdminClient();
        let response = await http.getJson(urls.adminClaims(tenantId, userId));
        httpAssert.expectStatusCode(response, 200);
        let claims = response.body;
        expect(claims).to.eql([
            claim
        ]);
    });

    it('Should get claim by key using admin api with admin user', async () => {
        let http = await api.defaultAdminClient();
        let response = await http.getJson(urls.adminClaim(tenantId, userId, claim.key));
        httpAssert.expectStatusCode(response, 200);
        expect(response.body).to.eql(claim);
    });
}

describe('Claim registration', () => {
    const tenant = data.randomTenant();
    const user = data.randomUser();
    const claim = data.randomClaim();

    describe('After adding a claim', () => {
        before(async () => {
            await api.dropDatabase();
            let http = await api.defaultAdminClient();
            let response = await http.putJson(urls.tenant(tenant.id), tenant);
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminUser(tenant.id, user.id), user);
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminClaim(tenant.id, user.id, claim.key), {
                value: claim.value
            });
            httpAssert.expectStatusCode(response, 201);
        });

        assertClaim(tenant.id, user.id, claim);
    });

    describe('After registering and updating a claim', () => {
        before(async () => {
            await api.dropDatabase();
            let http = await api.defaultAdminClient();
            let response = await http.putJson(urls.tenant(tenant.id), tenant);
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminUser(tenant.id, user.id), user);
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminClaim(tenant.id, user.id, claim.key), {
                value: uuid.v4()
            });
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminClaim(tenant.id, user.id, claim.key), {
                value: claim.value
            });
            httpAssert.expectStatusCode(response, 200);
        });

        assertClaim(tenant.id, user.id, claim);
    });

    describe('After registering two claims and deleting one', () => {
        const deleted = data.randomClaim();

        before(async () => {
            await api.dropDatabase();
            let http = await api.defaultAdminClient();
            let response = await http.putJson(urls.tenant(tenant.id), tenant);
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminUser(tenant.id, user.id), user);
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminClaim(tenant.id, user.id, claim.key), {
                value: claim.value
            });
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminClaim(tenant.id, user.id, deleted.key), {
                value: deleted.value
            });
            httpAssert.expectStatusCode(response, 201);
            response = await http.delete(urls.adminClaim(tenant.id, user.id, deleted.key));
            httpAssert.expectStatusCode(response, 200);
        });

        assertClaim(tenant.id, user.id, claim);
        
        it('Should not get deleted claim by key using admin api with admin user', async () => {
            let http = await api.defaultAdminClient();
            let response = await http.getJson(urls.adminClaim(tenant.id, user.id, deleted.key));
            httpAssert.expectStatusCode(response, 404);
        });
    });
});

