import { Db } from 'mongodb';

export interface DbMigration {
    migrate(db: Db) : Promise<void>
}
