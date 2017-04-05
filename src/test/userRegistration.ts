import * as api from './infrastructure/api';
import * as urls from './infrastructure/urls';
import * as httpAssert from './infrastructure/httpAssert';
import { expect } from 'chai';
import * as uuid from 'node-uuid';
import * as _ from 'lodash';
import * as settings from './infrastructure/settings';
import * as data from './infrastructure/data';

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
    const tenant = data.randomTenant();
    const user = data.randomUser();

    describe('After registering a user', () => {
        before(async () => {
            await api.dropDatabase();
            let http = await api.defaultAdminClient();
            let response = await http.putJson(urls.tenant(tenant.id), tenant);
            httpAssert.expectStatusCode(response, 201);
            response = await http.putJson(urls.adminUser(tenant.id, user.id), user);
            httpAssert.expectStatusCode(response, 201);
        });

        assertUser(tenant.id, user);
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

