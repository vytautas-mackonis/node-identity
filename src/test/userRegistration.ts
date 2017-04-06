import * as api from './infrastructure/api';
import * as urls from './infrastructure/urls';
import * as httpAssert from './infrastructure/httpAssert';
import { expect } from 'chai';
import * as uuid from 'node-uuid';
import * as _ from 'lodash';
import * as settings from './infrastructure/settings';
import * as data from './infrastructure/data';
import { HttpClient } from './infrastructure/httpClient';

function assertUser(tenantId: string, user: data.User) {
    it('Should list user using admin api with admin user', async () => {
        let http = await api.defaultAdminClient();
        let response = await http.getJson(urls.adminUsers(tenantId));
        httpAssert.expectStatusCode(response, 200);
        let users = response.body;
        _.remove(users, u => u.login === settings.defaultUsername);
        expect(users).to.eql([
            user
        ]);
    });

    it('Should get user by id using admin api with admin user', async () => {
        let http = await api.defaultAdminClient();
        let response = await http.getJson(urls.adminUser(tenantId, user.id));
        httpAssert.expectStatusCode(response, 200);
        expect(response.body).to.eql(user);
    });
}

describe('User registration', () => {
    let http: HttpClient;
    const tenant = data.randomTenant();
    const user = data.randomUser();

    describe('After registering a user', () => {
        before(async () => {
            await api.dropDatabase();
            http = await api.defaultAdminClient();
            let response = await http.putJson(urls.tenant(tenant.id), tenant);
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminUser(tenant.id, user.id), user);
            httpAssert.expectStatusCode(response, 201);
        });

        assertUser(tenant.id, user);

        it('Should not allow creating a user with the same login in the same tenant', async () => {
            let conflicting = data.randomUser();
            conflicting.login = user.login;
            let response = await http.putJson(urls.adminUser(tenant.id, conflicting.id), conflicting);
            httpAssert.expectStatusCode(response, 409);
        });

        it('Should allow creating a user with the same login in a different tenant', async () => {
            const tenant2 = data.randomTenant();
            let nonConflicting = data.randomUser();
            nonConflicting.login = user.login;
            let response = await http.putJson(urls.tenant(tenant2.id), tenant);
            response = await http.putJson(urls.adminUser(tenant2.id, nonConflicting.id), nonConflicting);
            httpAssert.expectStatusCode(response, 201);
        });

        it('Should not allow creating a user with the same email in the same tenant', async () => {
            let conflicting = data.randomUser();
            conflicting.email = user.email;
            let response = await http.putJson(urls.adminUser(tenant.id, conflicting.id), conflicting);
            httpAssert.expectStatusCode(response, 409);
        });

        it('Should allow creating a user with the same email in a different tenant', async () => {
            const tenant2 = data.randomTenant();
            let nonConflicting = data.randomUser();
            nonConflicting.email = user.email;
            let response = await http.putJson(urls.tenant(tenant2.id), tenant);
            response = await http.putJson(urls.adminUser(tenant2.id, nonConflicting.id), nonConflicting);
            httpAssert.expectStatusCode(response, 201);
        });
    });

    describe('After registering and updating a user', () => {
        before(async () => {
            await api.dropDatabase();
            let http = await api.defaultAdminClient();
            let response = await http.putJson(urls.tenant(tenant.id), tenant);
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminUser(tenant.id, user.id), {
                id: user.id,
                login: uuid.v4(),
                name: uuid.v4(),
                email: uuid.v4() + '@' + uuid.v4() + '.com'
            });
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminUser(tenant.id, user.id), user);
            httpAssert.expectStatusCode(response, 200);
        });

        assertUser(tenant.id, user);
    });

    describe('After registering two users and deleting one', () => {
        const deleted = data.randomUser();

        before(async () => {
            await api.dropDatabase();
            let http = await api.defaultAdminClient();
            let response = await http.putJson(urls.tenant(tenant.id), tenant);
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminUser(tenant.id, user.id), user);
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminUser(tenant.id, deleted.id), deleted);
            httpAssert.expectStatusCode(response, 201);
            response = await http.delete(urls.adminUser(tenant.id, deleted.id));
            httpAssert.expectStatusCode(response, 200);
        });

        assertUser(tenant.id, user);
        
        it('Should not get deleted user by id using admin api with admin user', async () => {
            let http = await api.defaultAdminClient();
            let response = await http.getJson(urls.adminUser(tenant.id, deleted.id));
            httpAssert.expectStatusCode(response, 404);
        });
    });
});

