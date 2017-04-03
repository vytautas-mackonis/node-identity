import * as nconf from 'nconf';
import * as server from '../../app/server';
import { HttpClient } from './httpClient';
import * as httpAssert from './httpAssert';
import * as urls from './urls';
import * as settings from './settings';
import { MongoClient, Db } from 'mongodb';

nconf.file('testconfig', 'conf/config_test.json');

let db: Db;

export async function start() {
    await server.start();
    const dbUrl = nconf.get('mongoDbUrl');
    db = await MongoClient.connect(dbUrl);
}

export async function dropDatabase() {
    await db.dropDatabase();
}

export function baseUrl() {
    return `http://localhost:${nconf.get('port')}/`;
}

export function anonymousClient() {
    return new HttpClient(baseUrl());
}

export async function authenticatedClient(username: string, password: string, clientId: string, clientSecret: string) {
    let client = anonymousClient();
    let response = await client.postFormData(urls.token(), {
        grant_type: 'password',
        username: username,
        password: password,
        client_id: clientId,
        client_secret: clientSecret
    });

    httpAssert.expectStatusCode(response, 200);
    
    let token = response.body.access_token;
    return new HttpClient(baseUrl(), {
        Authorization: 'Bearer ' + token
    });
}

export async function defaultAdminClient() {
    return await authenticatedClient(settings.defaultUsername,
        settings.defaultPassword,
        settings.adminClientId,
        settings.adminClientSecret
    );
}
