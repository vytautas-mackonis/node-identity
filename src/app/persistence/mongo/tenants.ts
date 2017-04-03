import * as persistence from '../../persistence';
import * as maybe from 'data.maybe';
import * as _ from 'lodash';

import { Db, Collection } from 'mongodb';

interface TenantDocument {
    _id: string;
    name: string;
}

function tenantToDocument(tenant: persistence.Tenant) : TenantDocument {
    return {
        _id: tenant.id,
        name: tenant.name
    };
}

function tenantFromDocument(tenant: TenantDocument): persistence.Tenant {
    return {
        id: tenant._id,
        name: tenant.name
    };
}

export class MongoTenantService implements persistence.TenantService {
    private tenants: Collection;
    
    constructor(db: Db) {
        this.tenants = db.collection('tenants');
    }

    public async query(filter: persistence.TenantFilter): Promise<persistence.Tenant[]> {
        let query: any = {};
        if (filter.id && _.isString(filter.id))
            query._id = filter.id;
        if (filter.name && _.isString(filter.name))
            query.name = filter.name;

        let results = await this.tenants.find<persistence.Tenant>(query)
            .map(tenantFromDocument)
            .toArray();
        return results;
    }

    public async save(tenant: persistence.Tenant): Promise<boolean> {
        const saveResult = await this.tenants.save(tenantToDocument(tenant));
        let updated = saveResult.result.upserted && saveResult.result.upserted.length > 0;
        return updated;
    }

    public async getById(id: string) : Promise<maybe.Maybe<persistence.Tenant>> {
        let queryResults = await this.query({ id: id });
        if (queryResults.length == 0)
            return maybe.Nothing<persistence.Tenant>();

        return maybe.Just(queryResults[0]);
    }

    public async delete(id: string) : Promise<void> {
        await this.tenants.remove({ _id: id });
    }
}

