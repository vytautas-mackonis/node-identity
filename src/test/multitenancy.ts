import * as api from './infrastructure/api';
import * as urls from './infrastructure/urls';
import * as httpAssert from './infrastructure/httpAssert';
import { expect } from 'chai';
import * as uuid from 'node-uuid';
import * as data from './infrastructure/data';
import * as _ from 'lodash';

describe('Multitenancy', () => {
    const tenants = [
        {
            tenant: data.randomTenant(),
            clients: [
                data.randomClient(),
                data.randomClient(),
                data.randomClient()
            ],
            users: [
                data.randomUser(),
                data.randomUser(),
                data.randomUser()
            ]
        },
        {
            tenant: data.randomTenant(),
            clients: [
                data.randomClient(),
                data.randomClient(),
                data.randomClient()
            ],
            users: [
                data.randomUser(),
                data.randomUser(),
                data.randomUser()
            ]
        }
    ];

    for (let i = 0; i < tenants.length; i++) {
        let tenant = tenants[i].tenant;

        for (let j = 0; j < tenants[i].clients.length; j++) {
            let client = tenants[i].clients[j];
            client.name = `Client ${j + 1} of tenant ${i + 1}`;
            client.active = true;
        }
        
        for (let j = 0; j < tenants[i].users.length; j++) {
            let user = tenants[i].users[j];
            user.name = `User ${j + 1} of tenant ${i + 1}`;
        }
    }

    before(async () => {
        await api.dropDatabase();
        const http = await api.defaultAdminClient();

        for (let i = 0; i < tenants.length; i++) {
            let tenant = tenants[i].tenant;
            let response = await http.putJson(urls.tenant(tenant.id), { name: tenant.name });
            httpAssert.expectStatusCode(response, 201);

            for (let j = 0; j < tenants[i].clients.length; j++) {
                let client = tenants[i].clients[j];
                client.name = `Client ${j + 1} of tenant ${i + 1}`;
                response = await http.putJson(urls.adminClient(tenant.id, client.id), client);
                httpAssert.expectStatusCode(response, 201);
            }
            
            for (let j = 0; j < tenants[i].users.length; j++) {
                let user = tenants[i].users[j];
                user.name = `User ${j + 1} of tenant ${i + 1}`;
                response = await http.putJson(urls.adminUser(tenant.id, user.id), user);
                httpAssert.expectStatusCode(response, 201);
                user['password'] = uuid.v4();
                response = await http.putJson(urls.adminUserPassword(tenant.id, user.id), { password: user['password'] });
                httpAssert.expectStatusCode(response, 200);
            }
        }
    });

    function sameTenantUserAndClientCanLogIn(user: data.User, client: data.Client) {
        it(`Should allow ${user.name} login using ${client.name}`, async () => {
            await api.authenticatedClient(user.login, user['password'], client.id, client.secret);
        });
    }
    
    function userCanSeeSingleClientOfSameTenant(user: data.User, loginClient: data.Client, retrievedClient: data.Client) {
        it(`Should allow ${user.name} get ${retrievedClient.name} by id`, async () => {
            const http = await api.authenticatedClient(user.login, user['password'], loginClient.id, loginClient.secret);
            const response = await http.getJson(urls.client(retrievedClient.id));
            httpAssert.expectStatusCode(response, 200);
            const copy = Object.assign({}, retrievedClient);
            delete copy['secret'];
            expect(response.body).to.be.eql(copy);
        });
    }

    function differentTenantUserAndClientsCannotLogIn(user: data.User, client: data.Client) {
        it(`Should not allow ${user.name} login using ${client.name}`, async () => {
            let http = api.anonymousClient();
            let response = await http.postFormData(urls.token(), {
                grant_type: 'password',
                username: user.login,
                password: user['password'],
                client_id: client.id,
                client_secret: client.secret
            });

            httpAssert.expectStatusCode(response, 400);
        });
    }
    
    function userCannotSeeSingleClientOfDifferentTenant(user: data.User, loginClient: data.Client, retrievedClient: data.Client) {
        it(`Should allow ${user.name} get ${retrievedClient.name} by id`, async () => {
            const http = await api.authenticatedClient(user.login, user['password'], loginClient.id, loginClient.secret);
            const response = await http.getJson(urls.client(retrievedClient.id));
            httpAssert.expectStatusCode(response, 404);
        });
    }

    function userCanSeeOnlyClientsOfHisTenant(user: data.User, loginClient: data.Client, tenantClients: data.Client[]) {
        it(`Should allow ${user.name} logged in using ${loginClient.name} see only his tenant clients`, async () => {
            const http = await api.authenticatedClient(user.login, user['password'], loginClient.id, loginClient.secret);
            const response = await http.getJson(urls.clients());
            httpAssert.expectStatusCode(response, 200);
            const copy = _.map(tenantClients, x => {
                const c = Object.assign({}, x);
                delete c['secret'];
                return c;
            });
            expect(response.body).to.be.eql(copy);
        });
    }

    function userCanSeeSingleUserOfSameTenant(user: data.User, loginClient: data.Client, retrievedUser: data.User) {
        it(`Should allow ${user.name} to get ${retrievedUser.name} by id`, async () => {
            const http = await api.authenticatedClient(user.login, user['password'], loginClient.id, loginClient.secret);
            const response = await http.getJson(urls.user(retrievedUser.id));
            httpAssert.expectStatusCode(response, 200);
            const copy = Object.assign({}, retrievedUser);
            delete copy['password'];
            expect(response.body).to.be.eql(copy);
        });
    }

    function userCannotSeeSingleUserOfDifferentTenant(user: data.User, loginClient: data.Client, retrievedUser: data.User) {
        it(`Should allow ${user.name} to get ${retrievedUser.name} by id`, async () => {
            const http = await api.authenticatedClient(user.login, user['password'], loginClient.id, loginClient.secret);
            const response = await http.getJson(urls.user(retrievedUser.id));
            httpAssert.expectStatusCode(response, 404);
        });
    }

    function userCanSeeOnlyUsersOfHisTenant(user: data.User, loginClient: data.Client, tenantUsers: data.User[]) {
        it(`Should allow ${user.name} see only his tenant users`, async () => {
            const http = await api.authenticatedClient(user.login, user['password'], loginClient.id, loginClient.secret);
            const response = await http.getJson(urls.users());
            httpAssert.expectStatusCode(response, 200);
            const copy = _.map(tenantUsers, x => {
                const c = Object.assign({}, x);
                delete c['password'];
                return c;
            });
            expect(response.body).to.be.eql(copy);
        });
    }
    for (let i = 0; i < tenants.length; i++) {
        for (let j = 0; j < tenants[i].users.length; j++) {
            for (let k = 0; k < tenants[i].clients.length; k++) {
                sameTenantUserAndClientCanLogIn(tenants[i].users[j], tenants[i].clients[k]);
                differentTenantUserAndClientsCannotLogIn(tenants[i].users[j], tenants[(i + 1) % tenants.length].clients[k]);
                userCanSeeSingleClientOfSameTenant(tenants[i].users[j], tenants[i].clients[k], tenants[i].clients[(k +1) % tenants[i].clients.length]);
                userCannotSeeSingleClientOfDifferentTenant(tenants[i].users[j], tenants[i].clients[k], tenants[(i + 1) % tenants.length].clients[k]);
                userCanSeeOnlyClientsOfHisTenant(tenants[i].users[j], tenants[i].clients[k], tenants[i].clients);
            }

            for (let k = 0; k < tenants[i].users.length; k++) {
                userCanSeeSingleUserOfSameTenant(tenants[i].users[j], tenants[i].clients[0], tenants[i].users[k]);
                userCannotSeeSingleUserOfDifferentTenant(tenants[i].users[j], tenants[i].clients[0], tenants[(i + 1) % tenants.length].users[k]);
            }

            userCanSeeOnlyUsersOfHisTenant(tenants[i].users[j], tenants[i].clients[0], tenants[i].users);
        }
    }
});
