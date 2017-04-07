import { Db, Collection } from 'mongodb';
import * as _ from 'lodash';
import { Client, ClientFilter, ClientService } from '../../persistence';
import * as maybe from 'data.maybe';

interface ClientDocument {
    _id: any;
    active: boolean;
    allowedOrigin: string;
    applicationType: string;
    name: string;
    refreshTokenLifetime: number;
    secretHash: string;
    tenantId: string;
}

function toDocument(id: string, client: Client) : ClientDocument {
    return {
        _id: id,
        active: client.active,
        allowedOrigin: client.allowedOrigin,
        applicationType: client.applicationType,
        name: client.name,
        refreshTokenLifetime: client.refreshTokenLifetime,
        secretHash: client.secretHash,
        tenantId: client.tenantId
    };
}

function fromDocument(client: ClientDocument) : Client {
    return {
        id: client._id,
        active: client.active,
        allowedOrigin: client.allowedOrigin,
        applicationType: client.applicationType,
        name: client.name,
        refreshTokenLifetime: client.refreshTokenLifetime,
        secretHash: client.secretHash,
        tenantId: client.tenantId
    };
}

export class MongoClientService implements ClientService {
    private clients: Collection;

    constructor(db: Db) {
        this.clients = db.collection('clients');
    }

    public async query(filter: ClientFilter) {
        let q: any = {};
        if (filter.id && _.isString(filter.id))
            q._id = filter.id;
        if (filter.tenantId && _.isString(filter.tenantId))
            q.tenantId = filter.tenantId;

        return await this.clients.find<Client>(q)
            .map(fromDocument)
            .toArray();
    }

    public async getById(id: string) {
        let results = await this.query({ id: id });
        if (results.length == 0) return maybe.Nothing<Client>();
        return maybe.Just(results[0]);
    }

    public async save(id: string, client: Client) {
        let doc = toDocument(id, client);
        let saveResult = await this.clients.save(doc);
        return saveResult.result.upserted && saveResult.result.upserted.length > 0;
    }

    public async delete(id: string) {
        await this.clients.remove({ _id: id });
    }
}
