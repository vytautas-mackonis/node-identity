import { assert } from 'chai';

export function expectStatusCode(response, statusCode: number) {
    assert(response.statusCode === statusCode, `expected HTTP status code ${statusCode} but got ${response.statusCode}. Response body: 
${JSON.stringify(response.body, null, 4)}`);
}
