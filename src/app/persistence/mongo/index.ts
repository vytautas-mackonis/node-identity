import { MongoClient } from 'mongodb';
import { MongoTenantService } from './tenants';
import { MongoClientService } from './clients';
import { MongoUserService } from './users';
import { MongoDatabaseInitializer } from './initializer';

export async function create(dbUrl: string) {
    let db = await MongoClient.connect(dbUrl);
    return {
        tenants: new MongoTenantService(db),
        clients: new MongoClientService(db),
        users: new MongoUserService(db),
        initializer: new MongoDatabaseInitializer(db)
    };
}
