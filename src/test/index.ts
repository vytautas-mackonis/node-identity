import * as api from './infrastructure/api';
import { Db } from 'mongodb';

let db: Db;

before(async () => {
    await api.start();
});
