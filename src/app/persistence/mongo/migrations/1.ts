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
            secretHash: '$argon2i$v=19$m=4096,t=3,p=1$Nm56NkJWNFFlS1c5OEpMTFBLbVA2alNsWGNTc20zNVoyQU9PNWdwZTlHa3JvamhETXNZcWJGdEJ1dW9BMGpH$WZ5feUSwbuiWCwxM3km34AvduSM7Hg2PsXoy7eRb8W0',
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
            passwordHash: '$argon2i$v=19$m=4096,t=3,p=1$UVk5RDB1VkswT3UzRXFtQms5UDZ6cmlHcmNZVlhpTTZVdTR1UjVLeWVFaUFXZGtOY1BjWENCMnRrdll5UXI1$bh+U8tLGn61bCsZXngOmm3Re/X8Lu/dBhpFLRpgHn/s',
            version: 0,
            passwordResetToken: null
        });

        await users.createIndex({ tenantId: 1, loginLowercase: 1 }, { unique: true, name: 'users_login' });
        await users.createIndex({ tenantId: 1, email: 1 }, { unique: true, name: 'users_email' });
    }
}

export = new InitialUserAndIndices();
