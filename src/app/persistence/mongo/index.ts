import { MongoClient } from 'mongodb';
import { MongoTenantService } from './tenants';
import { MongoClientService } from './clients';

export async function create(dbUrl: string) {
    let db = await MongoClient.connect(dbUrl);
    return {
        tenants: new MongoTenantService(db),
        clients: new MongoClientService(db)
    };
}
