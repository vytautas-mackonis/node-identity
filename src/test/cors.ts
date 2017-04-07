import * as api from './infrastructure/api';
import { HttpClient } from './infrastructure/httpClient';
import * as httpAssert from './infrastructure/httpAssert';
import * as data from './infrastructure/data';
import * as urls from './infrastructure/urls';
import * as uuid from 'node-uuid';
import { expect } from 'chai';
import * as nconf from 'nconf';
import * as _ from 'lodash';

describe('CORS', () => {
    function testAllowedOrigin(allowedOrigins, validOrigins, invalidOrigins) {
        describe(`When configured to allow origins '${allowedOrigins}'`, () => {
            let http: HttpClient;
            let tenant = data.randomTenant();
            let client = data.randomClient();
            client.applicationType = 'Public';
            client.active = true;
            client.allowedOrigin = allowedOrigins;
            let user = data.randomUser();
            let password = uuid.v4();

            before(async () => {
                nconf.set('allowedOrigin', allowedOrigins);
                await api.reset();

                http = await api.defaultAdminClient();
                let response = await http.putJson(urls.tenant(tenant.id), tenant);
                httpAssert.expectStatusCode(response, 201);
                response = await http.putJson(urls.adminClient(tenant.id, client.id), client);
                httpAssert.expectStatusCode(response, 201);
                response = await http.putJson(urls.adminUser(tenant.id, user.id), user);
                httpAssert.expectStatusCode(response, 201);
                response = await http.putJson(urls.adminUserPassword(tenant.id, user.id), {
                    password: password
                });
                httpAssert.expectStatusCode(response, 200);
                http = await api.authenticatedClient(user.login, password, client.id, uuid.v4());
            });

            function assertPreflightTokenCorsRequestAllowed(origin) {
                it(`Should allow origin ${origin} for a preflight request on token endpoint`, async () => {
                    let http = api.anonymousClient();
                    let headers = [
                        uuid.v4(),
                        uuid.v4(),
                        uuid.v4()
                    ].join(', ');

                    let response = await http.options(urls.token(), {
                        'Access-Control-Request-Headers': headers,
                        'Access-Control-Request-Method': 'POST',
                        'Origin': origin
                    });
                    httpAssert.expectStatusCode(response, 200);

                    let responseHeaders = _.transform(response.headers, (result, val, key:any) => {
                        result[key.toLowerCase()] = val;
                    });
                    expect(responseHeaders).to.have.property('access-control-allow-credentials', 'true');
                    expect(responseHeaders).to.have.property('access-control-allow-headers', headers);
                    expect(responseHeaders).to.have.property('access-control-allow-origin', origin);
                });
            }

            function assertPreflightCorsRequestAllowed(url, method, origin) {
                it(`Should allow origin ${origin} for a preflight request for ${method} ${url}`, async () => {
                    let headers = [
                        uuid.v4(),
                        uuid.v4(),
                        uuid.v4()
                    ].join(', ');

                    let response = await http.options(url, {
                        'Access-Control-Request-Headers': headers,
                        'Access-Control-Request-Method': method,
                        'Origin': origin
                    });
                    httpAssert.expectStatusCode(response, 200);

                    let responseHeaders = _.transform(response.headers, (result, val, key:any) => {
                        result[key.toLowerCase()] = val;
                    });
                    expect(responseHeaders).to.have.property('access-control-allow-credentials', 'true');
                    expect(responseHeaders).to.have.property('access-control-allow-headers', headers);
                    expect(responseHeaders).to.have.property('access-control-allow-origin', origin);
                });
            }
            
            function assertCorsRequestAllowed(url, method, origin) {
                it(`Should allow origin ${origin} for a non-preflight request for ${method} ${url}`, async () => {
                    let headers = [
                        'accept',
                        'authorization',
                        'connection',
                        'content-length',
                        'content-type',
                        'host',
                        'origin'
                    ].join(', ');

                    let response = await http.request(method, url, {}, {
                        'Origin': origin
                    });

                    let responseHeaders = _.transform(response.headers, (result, val, key:any) => {
                        result[key.toLowerCase()] = val;
                    });
                    expect(responseHeaders).to.have.property('access-control-allow-credentials', 'true');
                    expect(responseHeaders).to.have.property('access-control-allow-headers', headers);
                    expect(responseHeaders).to.have.property('access-control-allow-origin', origin);
                });
            }

            function assertPreflightTokenCorsRequestNotAllowed(origin) {
                it(`Should not allow origin ${origin} for a preflight request on token endpoint`, async () => {
                    let http = api.anonymousClient();
                    let response = await http.options(urls.token(), {
                        'Access-Control-Request-Headers': 'Content-Type',
                        'Access-Control-Request-Method': 'POST',
                        'Origin': origin
                    });
                    httpAssert.expectStatusCode(response, 200);

                    let responseHeaders = _.transform(response.headers, (result, val, key:any) => {
                        result[key.toLowerCase()] = val;
                    });
                    expect(responseHeaders).to.not.have.property('access-control-allow-origin');
                });
            }
            
            function assertPreflightCorsRequestNotAllowed(url, method, origin) {
                it(`Should not allow origin ${origin} for a preflight request for ${method} ${url}`, async () => {
                    let response = await http.options(url, {
                        'Access-Control-Request-Headers': 'Content-Type',
                        'Access-Control-Request-Method': method,
                        'Origin': origin
                    });
                    httpAssert.expectStatusCode(response, 200);

                    let responseHeaders = _.transform(response.headers, (result, val, key:any) => {
                        result[key.toLowerCase()] = val;
                    });
                    expect(responseHeaders).to.not.have.property('access-control-allow-origin');
                });
            }

            function assertCorsRequestNotAllowed(url, method, origin) {
                it(`Should not allow origin ${origin} for a non-preflight request for ${method} ${url}`, async () => {
                    let response = await http.request(method, url, {}, {
                        'Origin': origin
                    });

                    let responseHeaders = _.transform(response.headers, (result, val, key:any) => {
                        result[key.toLowerCase()] = val;
                    });
                    expect(responseHeaders).to.not.have.property('access-control-allow-origin');
                });
            }

            for (let i = 0; i < validOrigins.length; i++) {
                assertPreflightTokenCorsRequestAllowed(validOrigins[i]);
                assertPreflightCorsRequestAllowed(urls.tenants(), 'GET', validOrigins[i]);
                assertPreflightCorsRequestAllowed(urls.tenants(), 'PUT', validOrigins[i]);
                assertPreflightCorsRequestAllowed(urls.adminClients(uuid.v4()), 'PUT', validOrigins[i]);
                assertPreflightCorsRequestAllowed(urls.users(), 'PUT', validOrigins[i]);
                assertCorsRequestAllowed(urls.tenants(), 'GET', validOrigins[i]);
                assertCorsRequestAllowed(urls.tenants(), 'PUT', validOrigins[i]);
                assertCorsRequestAllowed(urls.adminClients(uuid.v4()), 'PUT', validOrigins[i]);
                assertCorsRequestAllowed(urls.users(), 'PUT', validOrigins[i]);
            }

            for (let i = 0; i < invalidOrigins.length; i++) {
                assertPreflightTokenCorsRequestNotAllowed(invalidOrigins[i]);
                assertPreflightCorsRequestNotAllowed(urls.tenants(), 'GET', invalidOrigins[i]);
                assertPreflightCorsRequestNotAllowed(urls.tenants(), 'PUT', invalidOrigins[i]);
                assertPreflightCorsRequestNotAllowed(urls.adminClients(uuid.v4()), 'PUT', invalidOrigins[i]);
                assertPreflightCorsRequestNotAllowed(urls.users(), 'PUT', invalidOrigins[i]);
                assertCorsRequestNotAllowed(urls.tenants(), 'GET', invalidOrigins[i]);
                assertCorsRequestNotAllowed(urls.tenants(), 'PUT', invalidOrigins[i]);
                assertCorsRequestNotAllowed(urls.adminClients(uuid.v4()), 'PUT', invalidOrigins[i]);
                assertCorsRequestNotAllowed(urls.users(), 'PUT', invalidOrigins[i]);
            }
        });
    }

    testAllowedOrigin('*', ['*'], []);
    testAllowedOrigin('foo.com', ['http://foo.com/', 'https://foo.com/', 'http://foo.com', 'https://foo.com'], ['http://bar.com/', 'http://inner.foo.com/']);
    testAllowedOrigin('inner.bar.com', ['http://inner.bar.com/'], ['http://bar.com/', 'http://inner.foo.com/', 'http://foo.com/']);
    testAllowedOrigin('*.inner.bar.com', ['http://some.very.very.deep.inner.bar.com/', 'https://other.inner.bar.com'], ['http://inner.bar.com', 'http://bar.com', 'http://inner.foo.com', 'http://foo.com']);
    testAllowedOrigin('*.inner.bar.com,inner.bar.com', ['http://inner.bar.com', 'http://some.very.very.deep.inner.bar.com/', 'https://other.inner.bar.com'], ['http://bar.com', 'http://inner.foo.com', 'http://foo.com']);

    function testAuthenticatedClientCors(allowedOrigins: string, validOrigins: string[], invalidOrigins: string[]) {
        describe(`When using a public client with allowed origins ${allowedOrigins} to authenticate`, () => {
            let http: HttpClient;
            let tenant = data.randomTenant();
            let client = data.randomClient();
            client.applicationType = 'Public';
            client.active = true;
            client.allowedOrigin = allowedOrigins;
            let user = data.randomUser();
            let password = uuid.v4();

            before(async () => {
                nconf.set('allowedOrigin', '*');
                await api.reset();
                http = await api.defaultAdminClient();

                let response = await http.putJson(urls.tenant(tenant.id), tenant);
                httpAssert.expectStatusCode(response, 201);
                response = await http.putJson(urls.adminClient(tenant.id, client.id), client);
                httpAssert.expectStatusCode(response, 201);
                response = await http.putJson(urls.adminUser(tenant.id, user.id), user);
                httpAssert.expectStatusCode(response, 201);
                response = await http.putJson(urls.adminUserPassword(tenant.id, user.id), {
                    password: password
                });
                httpAssert.expectStatusCode(response, 200);
                http = await api.authenticatedClient(user.login, password, client.id, 'anything');
            });

            it('Should be able to login using this client with any secret', async () => {
                let response = await api.login(user.login, password, client.id, 'whatever');
                httpAssert.expectStatusCode(response, 200);
            });

            function loginRequestCanBeSent(origin: string) {
                it(`Should allow origin ${origin} for login`, async () => {
                    let headers = [
                        'accept',
                        'connection',
                        'content-length',
                        'content-type',
                        'host',
                        'origin'
                    ].join(', ');

                    let response = await api.login(user.login, password, client.id, 'whatever', {
                        'Origin': origin
                    });
                    httpAssert.expectStatusCode(response, 200);

                    let responseHeaders = _.transform(response.headers, (result, val, key:any) => {
                        result[key.toLowerCase()] = val;
                    });
                    expect(responseHeaders).to.have.property('access-control-allow-credentials', 'true');
                    expect(responseHeaders).to.have.property('access-control-allow-headers', headers);
                    expect(responseHeaders).to.have.property('access-control-allow-origin', origin);
                });
            }

            function loginRequestCannotBeSent(origin: string) {
                it(`Should not allow origin ${origin} for login`, async () => {
                    let headers = [
                        uuid.v4(),
                        uuid.v4(),
                        uuid.v4()
                    ].join(', ');

                    let response = await api.login(user.login, password, client.id, 'whatever', {
                        'Origin': origin
                    });
                    httpAssert.expectStatusCode(response, 200);

                    let responseHeaders = _.transform(response.headers, (result, val, key:any) => {
                        result[key.toLowerCase()] = val;
                    });
                    expect(responseHeaders).to.not.have.property('access-control-allow-origin');
                });
            }

            for (let i = 0; i < validOrigins.length; i++) {
                loginRequestCanBeSent(validOrigins[i]);
            }

            for (let i = 0; i < invalidOrigins.length; i++) {
                loginRequestCannotBeSent(invalidOrigins[i]);
            }
        });

    }

    testAuthenticatedClientCors('foo.com', ['http://foo.com/', 'https://foo.com/', 'http://foo.com', 'https://foo.com'], ['http://bar.com/', 'http://inner.foo.com/']);
    testAuthenticatedClientCors('inner.bar.com', ['http://inner.bar.com/'], ['http://bar.com/', 'http://inner.foo.com/', 'http://foo.com/']);
    testAuthenticatedClientCors('*.inner.bar.com', ['http://some.very.very.deep.inner.bar.com/', 'https://other.inner.bar.com'], ['http://inner.bar.com', 'http://bar.com', 'http://inner.foo.com', 'http://foo.com']);
    testAuthenticatedClientCors('*.inner.bar.com,inner.bar.com', ['http://inner.bar.com', 'http://some.very.very.deep.inner.bar.com/', 'https://other.inner.bar.com'], ['http://bar.com', 'http://inner.foo.com', 'http://foo.com']);
});
