import * as api from './infrastructure/api';
import { HttpClient } from './infrastructure/httpClient';
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

function assertNoClaim(tenantId: string, userId: string, claim: data.Claim) {
    it('Should not list claim using admin api with admin user', async () => {
        let http = await api.defaultAdminClient();
        let response = await http.getJson(urls.adminClaims(tenantId, userId));
        httpAssert.expectStatusCode(response, 200);
        let claims = response.body;
        expect(claims).to.eql([]);
    });

    it('Should not get claim by key using admin api with admin user', async () => {
        let http = await api.defaultAdminClient();
        let response = await http.getJson(urls.adminClaim(tenantId, userId, claim.key));
        httpAssert.expectStatusCode(response, 404);
    });
}

describe('Claim registration', () => {
    const tenant = data.randomTenant();
    const user = data.randomUser();
    const claim = data.randomClaim();

    describe('After adding a claim', () => {
        before(async () => {
            await api.reset();
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
            await api.reset();
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
            await api.reset();
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

    describe('After registering claims for different users', () => {
        const user2 = data.randomUser();
        const claim2 = data.randomClaim();
        const claim3 = data.randomClaim();

        before(async () => {
            await api.reset();
            const http = await api.defaultAdminClient();
            let response = await http.putJson(urls.tenant(tenant.id), tenant);
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminUser(tenant.id, user.id), user);
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminUser(tenant.id, user2.id), user2);
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminClaim(tenant.id, user.id, claim.key), {
                value: claim.value
            });
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminClaim(tenant.id, user.id, claim2.key), {
                value: claim2.value
            });
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminClaim(tenant.id, user2.id, claim3.key), {
                value: claim3.value
            });
            httpAssert.expectStatusCode(response, 201);
        });

        it('Should not get second user claims when listing first user claims', async () => {
            const http = await api.defaultAdminClient();
            const response = await http.getJson(urls.adminClaims(tenant.id, user.id));
            httpAssert.expectStatusCode(response, 200);
            expect(response.body).to.have.deep.members([
                claim,
                claim2
            ]);
        });
        
        it('Should not get first user claims when listing second user claims', async () => {
            const http = await api.defaultAdminClient();
            const response = await http.getJson(urls.adminClaims(tenant.id, user2.id));
            httpAssert.expectStatusCode(response, 200);
            expect(response.body).to.be.eql([
                claim3
            ]);
        });

        it('Should not get second user claim when getting first user claim by second user claim key', async () => {
            const http = await api.defaultAdminClient();
            const response = await http.getJson(urls.adminClaim(tenant.id, user.id, claim3.key));
            httpAssert.expectStatusCode(response, 404);
        });
    });
    
    describe('After registering claims for multiple users and updating one using admin api', async () => {
        const user2 = data.randomUser();
        const claim2 = data.randomClaim();
        claim2.key = claim.key;

        before(async () => {
            await api.reset();
            const http = await api.defaultAdminClient();
            let response = await http.putJson(urls.tenant(tenant.id), tenant);
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminUser(tenant.id, user.id), user);
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminUser(tenant.id, user2.id), user2);
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminClaim(tenant.id, user.id, claim.key), {
                value: claim.value
            });
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminClaim(tenant.id, user2.id, claim.key), {
                value: claim.value
            });
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminClaim(tenant.id, user2.id, claim.key), {
                value: claim2.value
            });
            httpAssert.expectStatusCode(response, 200);
        });

        assertClaim(tenant.id, user.id, claim);
        assertClaim(tenant.id, user2.id, claim2);
    });

    describe('After registering claims for multiple users and deleting one using admin api', async () => {
        const user2 = data.randomUser();

        before(async () => {
            await api.reset();
            const http = await api.defaultAdminClient();
            let response = await http.putJson(urls.tenant(tenant.id), tenant);
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminUser(tenant.id, user.id), user);
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminUser(tenant.id, user2.id), user2);
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminClaim(tenant.id, user.id, claim.key), {
                value: claim.value
            });
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminClaim(tenant.id, user2.id, claim.key), {
                value: claim.value
            });
            httpAssert.expectStatusCode(response, 201);
            response = await http.delete(urls.adminClaim(tenant.id, user2.id, claim.key));
        });

        assertClaim(tenant.id, user.id, claim);
        assertNoClaim(tenant.id, user2.id, claim);
    });

    describe('After replacing claims for user', async () => {
        let http: HttpClient;

        const claims = [
            data.randomClaim(),
            data.randomClaim(),
            data.randomClaim()
        ];

        before(async () => {
            await api.reset();
            http = await api.defaultAdminClient();
            let response = await http.putJson(urls.tenant(tenant.id), tenant);
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminUser(tenant.id, user.id), user);
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminClaim(tenant.id, user.id, claim.key), {
                value: claim.value
            });
            httpAssert.expectStatusCode(response, 201);
        });

        it('Should list only new claims when they are replaced using admin api', async () => {
            let response = await http.putJson(urls.adminClaims(tenant.id, user.id), claims);
            httpAssert.expectStatusCode(response, 200);
            response = await http.getJson(urls.adminClaims(tenant.id, user.id));
            httpAssert.expectStatusCode(response, 200);
            expect(response.body).to.have.deep.members(claims);
        })
    });
});

