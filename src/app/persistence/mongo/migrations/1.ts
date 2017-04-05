import { DbMigration } from '../migration';
import { Db } from 'mongodb';
import * as mongouuid from 'mongo-uuid';

class InitialUserAndIndices implements DbMigration {
    public async migrate(db: Db) {
        const tenants = db.collection('tenants');
        const clients = db.collection('clients');
        const users = db.collection('users');

        await tenants.save({
            _id: 'admin',
            name: 'Node-identity adminitrator'
        });

        await clients.save({
            _id: 'node-identity-app',
            name: 'Node-identity application',
            tenantId: 'admin',
            applicationType: 'Confidential',
            secretHash: '$argon2i$v=19$m=131072,t=10,p=4$Nm56NkJWNFFlS1c5OEpMTFBLbVA2alNsWGNTc20zNVoyQU9PNWdwZTlHa3JvamhETXNZcWJGdEJ1dW9BMGpH$+uYT1MPVWnb34TmEvKoLzp6SxK/WjZZzCxQXZoT36Z0',
            allowedOrigin: null,
            refreshTokenLifetime: 30 * 60 * 1000,
            active: true
        });

        await users.save({
            userId: 'b74bcd8c-a14e-452f-9df3-fd19f239ae69',
            tenantId: 'admin',
            login: 'admin',
            loginLowercase: 'admin',
            name: 'Node-identity administrator',
            email: 'non-existing@unknowndomain',
            passwordHash: '$argon2i$v=19$m=131072,t=10,p=4$Nm56NkJWNFFlS1c5OEpMTFBLbVA2alNsWGNTc20zNVoyQU9PNWdwZTlHa3JvamhETXNZcWJGdEJ1dW9BMGpH$jR1WxuqQp3vDq0/FtljnLL9hqYI4OJutL3PololDA4s',
            version: 0,
            passwordResetToken: null
        });

    }
}

export = new InitialUserAndIndices();
