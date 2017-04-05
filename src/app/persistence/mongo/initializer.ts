import { Db } from 'mongodb';
import { DatabaseInitializer } from '../../persistence';
import { DbMigration } from './migration';
import * as _ from 'lodash';

export class MongoDatabaseInitializer implements DatabaseInitializer {
    constructor(private db: Db) {}

    private async getVersion() {
        let collection = this.db.collection('version');
        let version = await collection.find({}).limit(1).toArray();
        return version.length > 0 ? version[0].version : 0;
    }

    private async updateVersion(version: number) {
        let collection = this.db.collection('version');
        await collection.save({ _id: 'dbversion', version: version });
    }

    private getMigrationsFromVersion(version: number): DbMigration[] {
        let allMigrations = [
            require('./migrations/1')
        ];

        return _.slice(allMigrations, version);
    }

    public async initialize() {
        let currentVersion = await this.getVersion();
        let migrations = this.getMigrationsFromVersion(currentVersion);
        
        for (let i = 0; i < migrations.length; i++) {
            await migrations[i].migrate(this.db);
            currentVersion++;
            await this.updateVersion(currentVersion);
        }
    }
}
