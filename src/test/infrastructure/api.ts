import * as nconf from 'nconf';
import * as server from '../../app/server';
import { HttpClient } from './httpClient';
import * as httpAssert from './httpAssert';
import * as urls from './urls';
import * as settings from './settings';
import { MongoClient, Db } from 'mongodb';


let db: Db;

export async function start() {
    nconf.env();
    nconf.file('testconfig', 'conf/config_test.json');
    await server.start();
    const dbUrl = nconf.get('mongoDbUrl');
    db = await MongoClient.connect(dbUrl);
}

export async function reset() {
    server.stop();
    await db.dropDatabase();
    await server.start();
}

export function baseUrl() {
    return `http://localhost:${nconf.get('port')}/`;
}

export function anonymousClient(headers?: { [key:string]: string }) {
    return new HttpClient(baseUrl(), headers);
}

export async function login(username: string, password: string, clientId: string, clientSecret: string, headers?: { [key: string]: string }) {
    let client = anonymousClient();
    let response = await client.postFormData(urls.token(), {
        grant_type: 'password',
        username: username,
        password: password,
        client_id: clientId,
        client_secret: clientSecret
    }, headers);
    return response;
}

export async function authenticatedClient(username: string, password: string, clientId: string, clientSecret: string) {
    let response = await login(username, password, clientId, clientSecret);
    httpAssert.expectStatusCode(response, 200);
    return new HttpClient(baseUrl(), {
        Authorization: 'Bearer ' + response.body.access_token
    });
}

export async function defaultAdminClient() {
    return await authenticatedClient(settings.defaultUsername,
        settings.defaultPassword,
        settings.adminClientId,
        settings.adminClientSecret
    );
}
