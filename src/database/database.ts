import mysql from 'mysql2/promise';
import { DatabaseErrors } from '../models/models';

const executeQuery = async <T>(
    sqlQuery: string,
    params?: unknown[]
): Promise<T> => {
    const connection = await mysql
        .createConnection({
            host: process.env.MYSQL_HOST || 'localhost',
            user: process.env.MYSQL_USER || 'caker',
            port: +(process.env.MYSQL_PORT || '3306'),
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_SCHEMA || 'happycake'
        })
        .catch((error: unknown) => {
            console.log('Database Connection error', (error as Error).message);
            throw new Error(DatabaseErrors.UNAVAILABLE);
        });

    try {
        const result = await connection.execute(sqlQuery, params);
        return result[0] as T;
    } catch (error: unknown) {
        console.error('Database error', (error as Error).message);
        throw new Error(DatabaseErrors.QUERY);
    } finally {
        await connection.end();
    }
};

export default { executeQuery };
