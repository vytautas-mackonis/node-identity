import * as rp from 'request-promise-native';

export class HttpClient {
    constructor(private baseUrl: string, private headers?: { [key: string]: string }) {}

    public getJson(path: string) {
        return rp({
            method: 'GET',
            uri: this.baseUrl + path,
            resolveWithFullResponse: true,
            headers: this.headers,
            json: true,
            simple: false
        });
    }

    public putJson<T>(path: string, data: T) {
        return rp({
            method: 'PUT',
            uri: this.baseUrl + path,
            body: data,
            resolveWithFullResponse: true,
            headers: this.headers,
            json: true,
            simple: false
        });
    }
    
    public postJson<T>(path: string, data: T) {
        return rp({
            method: 'POST',
            uri: this.baseUrl + path,
            body: data,
            resolveWithFullResponse: true,
            headers: this.headers,
            json: true,
            simple: false
        });
    }
    
    public request<T>(method: string, path: string, data?: T, headers?: { [key: string]: string }) {
        return rp({
            method: method,
            uri: this.baseUrl + path,
            body: data,
            resolveWithFullResponse: true,
            headers: Object.assign({}, this.headers, headers),
            json: true,
            simple: false
        });
    }

    public postFormData<T>(path: string, data: T, headers?: { [key: string]: string }) {
        return rp({
            method: 'POST',
            uri: this.baseUrl + path,
            form: data,
            resolveWithFullResponse: true,
            headers: Object.assign({}, this.headers, headers),
            json: true,
            simple: false
        });
    }

    public delete(path: string) {
        return rp({
            method: 'DELETE',
            uri: this.baseUrl + path,
            resolveWithFullResponse: true,
            headers: this.headers,
            json: true,
            simple: false
        });
    }

    public options(path: string, headers: { [key: string]: string }) {
        let actualHeaders = Object.assign({}, this.headers, headers);
        return rp({
            method: 'OPTIONS',
            uri: this.baseUrl + path,
            resolveWithFullResponse: true,
            headers: actualHeaders,
            simple: false
        });
    }
}
