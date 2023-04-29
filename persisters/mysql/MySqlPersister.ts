// Copyright (c) 2022-2023. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.
// Copyright (c) 2020-2021. Sendanor. All rights reserved.

import { createPool, Pool, FieldInfo, MysqlError } from "mysql";
import { map } from "../../../core/functions/map";
import { reduce } from "../../../core/functions/reduce";
import { EntityMetadata, EntityField} from "../../types/EntityMetadata";
import { Persister } from "../../Persister";
import { RepositoryError } from "../../types/RepositoryError";
import { RepositoryEntityError } from "../../types/RepositoryEntityError";
import { Entity, EntityIdTypes } from "../../Entity";
import {
    COUNT_ALL_QUERY_STRING,
    COUNT_BY_COLUMN_QUERY_STRING,
    DELETE_ALL_BY_ID_QUERY_STRING,
    DELETE_ALL_QUERY_STRING,
    DELETE_BY_COLUMN_QUERY_STRING,
    DELETE_BY_ID_QUERY_STRING,
    EXISTS_BY_COLUMN_QUERY_STRING,
    INSERT_QUERY_STRING,
    SELECT_ALL_QUERY_STRING,
    SELECT_BY_COLUMN_LIST_QUERY_STRING,
    SELECT_BY_COLUMN_QUERY_STRING,
    UPDATE_QUERY_STRING
} from "./MySqlConstants";
import { EntityUtils } from "../../EntityUtils";
import { MySqlCharset } from "./types/MySqlCharset";
import { isArray } from "../../../core/types/Array";
import { LogService } from "../../../core/LogService";
import { LogLevel } from "../../../core/types/LogLevel";

export type QueryResultPair = [any, readonly FieldInfo[] | undefined];

const LOG = LogService.createLogger('MySqlPersister');

/**
 * This persister implements entity store over MySQL database.
 */
export class MySqlPersister implements Persister {

    public static setLogLevel (level: LogLevel) {
        LOG.setLogLevel(level);
    }

    private readonly _pool        : Pool;
    private readonly _tablePrefix : string;
    private readonly _queryTimeout : number | undefined;

    /**
     *
     * @param host
     * @param user
     * @param password
     * @param database
     * @param tablePrefix
     * @param connectionLimit
     * @param queueLimit
     * @param connectTimeout Milliseconds?
     * @param acquireTimeout Seconds -- or Milliseconds?
     * @param timeout Milliseconds
     * @param queryTimeout Milliseconds
     * @param waitForConnections
     * @param charset Connection charset. Defaults to UTF8_GENERAL_CI
     */
    public constructor (
        host: string,
        user: string,
        password: string,
        database: string,
        tablePrefix: string = '',
        connectionLimit: number = 100,
        queueLimit: number = 0,
        acquireTimeout: number = 60*60*1000,
        connectTimeout: number = 60*60*1000,
        timeout : number = 60*60*1000,
        queryTimeout : number | undefined = 60*60*1000,
        waitForConnections : boolean = true,
        charset : MySqlCharset | string = MySqlCharset.UTF8_GENERAL_CI
    ) {
        this._tablePrefix = tablePrefix;
        this._queryTimeout = queryTimeout;
        this._pool = createPool(
            {
                connectionLimit,
                connectTimeout,
                host,
                user,
                charset,
                password,
                database,
                acquireTimeout,
                timeout,
                waitForConnections
            }
        );
    }

    public async insert<T extends Entity, ID extends EntityIdTypes>(
        entities: T | T[],
        metadata: EntityMetadata
    ): Promise<T> {

        LOG.debug(`insert: entities = `, entities);
        LOG.debug(`insert: metadata = `, metadata);

        if (!isArray(entities)) {
            entities = [entities];
        }

        const {tableName} = metadata;
        LOG.debug(`tableName = `, tableName);

        const fields = metadata.fields.filter((fld: EntityField) => !EntityUtils.isIdField(fld, metadata));
        LOG.debug(`fields = `, fields);

        const colNames = fields.map((col: EntityField) => col.columnName);
        LOG.debug(`colNames = `, colNames);

        const insertValues = map(entities, (item: T) => {
            return fields.map((col: EntityField) => {
                return (item as any)[col.propertyName];
            });
        });
        LOG.debug(`insertValues = `, insertValues);

        const queryValues = [`${this._tablePrefix}${tableName}`, colNames, insertValues];
        LOG.debug(`queryValues = `, queryValues);

        const [results] = await this._query(INSERT_QUERY_STRING, queryValues);
        // LOG.debug(`results = `, results);

        const entityId = results?.insertId;
        LOG.debug(`entityId = `, entityId);

        if (!entityId) {
            throw new RepositoryError(RepositoryError.Code.CREATED_ENTITY_ID_NOT_FOUND, `Entity id could not be found for newly created entity`);
        }

        const resultEntity: T | undefined = await this.findById(entityId, metadata);
        LOG.debug(`resultEntity = `, resultEntity);

        if (resultEntity) {
            return resultEntity;
        } else {
            throw new RepositoryEntityError(entityId, RepositoryEntityError.Code.ENTITY_NOT_FOUND, `Newly created entity not found: #${entityId}`);
        }

    }

    public async update<T extends Entity, ID extends EntityIdTypes>(
        entity: T,
        metadata: EntityMetadata
    ): Promise<T> {

        LOG.debug(`update: entity = `, entity);
        LOG.debug(`update: metadata = `, metadata);

        const {tableName} = metadata;
        LOG.debug(`tableName = `, tableName);

        const idColName = EntityUtils.getIdColumnName(metadata);
        LOG.debug(`idColName = `, idColName);

        const id: ID = EntityUtils.getId<T, ID>(entity, metadata, this._tablePrefix);
        LOG.debug(`id = `, id);

        const fields = metadata.fields.filter((fld: EntityField) => !EntityUtils.isIdField(fld, metadata));
        LOG.debug(`fields = `, fields);

        const assignmentListPairs: [string, any][] = fields.map(
            (fld: EntityField): [string, any] => [`${fld.columnName}`, (entity as any)[fld.propertyName]]
        );
        LOG.debug(`assignmentListPairs = `, assignmentListPairs);

        const assignmentListValues: any[] = reduce(
            assignmentListPairs,
            (a: any[], pair: [string, any]) => {
                return a.concat(pair);
            },
            []
        );
        LOG.debug(`assignmentListValues = `, assignmentListValues);

        const assignmentListQueryString = fields.map(() => `?? = ?`).join(', ');
        LOG.debug(`assignmentListQueryString = `, assignmentListQueryString);

        const queryString = UPDATE_QUERY_STRING(assignmentListQueryString);
        LOG.debug(`queryString = `, queryString);
        const queryValues = [`${this._tablePrefix}${tableName}`, ...assignmentListValues, idColName, id];
        LOG.debug(`queryValues = `, queryValues);

        await this._query(queryString, queryValues);

        const resultEntity: T | undefined = await this.findById(id, metadata);
        LOG.debug(`resultEntity = `, resultEntity);

        if (resultEntity) {
            return resultEntity;
        } else {
            throw new RepositoryEntityError(id, RepositoryEntityError.Code.ENTITY_NOT_FOUND, `Entity not found: #${id}`);
        }

    }

    public async deleteAll<T extends Entity, ID extends EntityIdTypes>(
        metadata: EntityMetadata
    ): Promise<void> {
        LOG.debug(`deleteAll: metadata = `, metadata);
        const {tableName} = metadata;
        LOG.debug(`tableName = `, tableName);
        await this._query(DELETE_ALL_QUERY_STRING, [`${this._tablePrefix}${tableName}`]);
    }

    public async deleteById<T extends Entity, ID extends EntityIdTypes>(
        id: ID,
        metadata: EntityMetadata
    ): Promise<void> {
        LOG.debug(`deleteById: id = `, id);
        LOG.debug(`deleteById: metadata = `, metadata);

        const {tableName} = metadata;
        LOG.debug(`deleteById: tableName = `, tableName);

        const idColName = EntityUtils.getIdColumnName(metadata);
        LOG.debug(`deleteById: idColName = `, idColName);

        await this._query(DELETE_BY_ID_QUERY_STRING, [`${this._tablePrefix}${tableName}`, idColName, id]);

    }

    public async deleteAllById<T extends Entity, ID extends EntityIdTypes>(
        ids: ID[],
        metadata: EntityMetadata
    ): Promise<void> {
        LOG.debug(`deleteAllById: ids = `, ids);
        if (ids.length <= 0) throw new TypeError('At least one ID must be selected. Array was empty.');
        LOG.debug(`deleteAllById: metadata = `, metadata);
        const {tableName} = metadata;
        LOG.debug(`deleteAllById: tableName = `, tableName);
        const idColumnName: string = EntityUtils.getIdColumnName(metadata);
        LOG.debug(`deleteAllById: idColumnName = `, idColumnName);
        const queryValues = [`${this._tablePrefix}${tableName}`, idColumnName, ids];
        LOG.debug(`deleteAllById: queryValues = `, queryValues);
        const [results] = await this._query(DELETE_ALL_BY_ID_QUERY_STRING, queryValues);
        // LOG.debug(`deleteAllById: results = `, results);
        return results.map((row: any) => EntityUtils.toEntity<T, ID>(row, metadata));
    }

    public async deleteAllByProperty<
        T extends Entity,
        ID extends EntityIdTypes
    >(
        property : string,
        value    : any,
        metadata : EntityMetadata
    ): Promise<void> {
        LOG.debug(`deleteAllByProperty: property = `, property);
        LOG.debug(`deleteAllByProperty: value = `, value);
        LOG.debug(`deleteAllByProperty: metadata = `, metadata);
        const {tableName} = metadata;
        LOG.debug(`deleteAllByProperty: tableName = `, tableName);

        const columnName = EntityUtils.getColumnName(property, metadata.fields);
        LOG.debug(`deleteAllByProperty: columnName = `, columnName);

        await this._query(
            DELETE_BY_COLUMN_QUERY_STRING,
            [`${this._tablePrefix}${tableName}`, columnName, value]
        );

    }

    public async findById<
        T extends Entity,
        ID extends EntityIdTypes
    >(
        id: ID,
        metadata: EntityMetadata
    ): Promise<T | undefined> {
        LOG.debug(`findById: id = `, id);
        LOG.debug(`findById: metadata = `, metadata);
        const {tableName} = metadata;
        LOG.debug(`findById: tableName = `, tableName);
        const idColumnName = EntityUtils.getIdColumnName(metadata);
        LOG.debug(`findById: idColumnName = `, idColumnName);
        const [results] = await this._query(SELECT_BY_COLUMN_QUERY_STRING, [`${this._tablePrefix}${tableName}`, idColumnName, id]);
        // LOG.debug(`findById: results = `, results);
        return results.length >= 1 && results[0] ? EntityUtils.toEntity<T, ID>(results[0], metadata) : undefined;
    }

    public async findByProperty<
        T extends Entity,
        ID extends EntityIdTypes
    > (
        property : string,
        value    : any,
        metadata : EntityMetadata
    ): Promise<T | undefined> {
        LOG.debug(`findByProperty: property = `, property);
        LOG.debug(`findByProperty: value = `, value);
        LOG.debug(`findByProperty: metadata = `, metadata);
        const {tableName} = metadata;
        LOG.debug(`findByProperty: tableName = `, tableName);
        const columnName = EntityUtils.getColumnName(property, metadata.fields);
        LOG.debug(`findByProperty: columnName = `, columnName);
        const [results] = await this._query(SELECT_BY_COLUMN_QUERY_STRING, [`${this._tablePrefix}${tableName}`, columnName, value]);
        // LOG.debug(`findByProperty: results = `, results);
        return results.length >= 1 && results[0] ? EntityUtils.toEntity<T, ID>(results[0], metadata) : undefined;
    }


    public async findAll<T extends Entity,
        ID extends EntityIdTypes>(
        metadata: EntityMetadata
    ): Promise<T[]> {
        LOG.debug(`findAll: metadata = `, metadata);
        const {tableName} = metadata;
        LOG.debug(`findAll: tableName = `, tableName);
        const [results] = await this._query(SELECT_ALL_QUERY_STRING, [`${this._tablePrefix}${tableName}`]);
        // LOG.debug(`findAll: results = `, results);
        return results.map((row: any) => EntityUtils.toEntity<T, ID>(row, metadata));
    }

    public async findAllById<T extends Entity,
        ID extends EntityIdTypes>(
        ids: ID[],
        metadata: EntityMetadata
    ): Promise<T[]> {
        LOG.debug(`findAllById: ids = `, ids);
        if (ids.length <= 0) throw new TypeError('At least one ID must be selected. Array was empty.');
        LOG.debug(`findAllById: metadata = `, metadata);
        const {tableName} = metadata;
        LOG.debug(`findAllById: tableName = `, tableName);
        const idColumnName: string = EntityUtils.getIdColumnName(metadata);
        LOG.debug(`findAllById: idColumnName = `, idColumnName);
        const queryValues = [`${this._tablePrefix}${tableName}`, idColumnName, ids];
        LOG.debug(`findAllById: queryValues = `, queryValues);
        const [results] = await this._query(SELECT_BY_COLUMN_LIST_QUERY_STRING, queryValues);
        // LOG.debug(`findAllById: results = `, results);
        return results.map((row: any) => EntityUtils.toEntity<T, ID>(row, metadata));
    }

    public async findAllByProperty<
        T extends Entity,
        ID extends EntityIdTypes
    >(
        property : string,
        value    : any,
        metadata : EntityMetadata
    ): Promise<T[]> {
        LOG.debug(`findAllByProperty: property = `, property);
        LOG.debug(`findAllByProperty: value = `, value);
        LOG.debug(`findAllByProperty: metadata = `, metadata);
        const {tableName} = metadata;
        LOG.debug(`findAllByProperty: tableName = `, tableName);
        const columnName = EntityUtils.getColumnName(property, metadata.fields);
        LOG.debug(`findAllByProperty: columnName = `, columnName);
        const [results] = await this._query(SELECT_BY_COLUMN_QUERY_STRING, [`${this._tablePrefix}${tableName}`, columnName, value]);
        // LOG.debug(`findAllByProperty: results = `, results);
        return results.map((row: any) => EntityUtils.toEntity<T, ID>(row, metadata));
    }

    public async count<T extends Entity,
        ID extends EntityIdTypes>(
        metadata: EntityMetadata
    ): Promise<number> {
        LOG.debug(`count: metadata = `, metadata);
        const {tableName} = metadata;
        LOG.debug(`count: tableName = `, tableName);
        const [results] = await this._query(COUNT_ALL_QUERY_STRING, ['count', `${this._tablePrefix}${tableName}`]);
        // LOG.debug(`count: results = `, results);
        if (results.length !== 1) {
            throw new RepositoryError(RepositoryError.Code.COUNT_INCORRECT_ROW_AMOUNT, `count: Incorrect amount of rows in the response`);
        }
        return results[0].count;
    }

    public async countByProperty<T extends Entity,
        ID extends EntityIdTypes>(
        property : string,
        value    : any,
        metadata : EntityMetadata
    ): Promise<number> {
        LOG.debug(`countByProperty: property = `, property);
        LOG.debug(`countByProperty: value = `, value);
        LOG.debug(`countByProperty: metadata = `, metadata);
        const {tableName} = metadata;
        LOG.debug(`countByProperty: tableName = `, tableName);
        const [results] = await this._query(
            COUNT_BY_COLUMN_QUERY_STRING,
            ['count', `${this._tablePrefix}${tableName}`, property, value]
        );
        // LOG.debug(`countByProperty: results = `, results);
        if (results.length !== 1) {
            throw new RepositoryError(RepositoryError.Code.COUNT_INCORRECT_ROW_AMOUNT, `countByProperty: Incorrect amount of rows in the response`);
        }
        return results[0].count;
    }

    public async existsByProperty<
        T extends Entity,
        ID extends EntityIdTypes
    >(
        property : string,
        value    : any,
        metadata : EntityMetadata
    ): Promise<boolean> {
        LOG.debug(`existsByProperty: property = `, property);
        LOG.debug(`existsByProperty: value = `, value);
        LOG.debug(`existsByProperty: metadata = `, metadata);
        const {tableName} = metadata;
        LOG.debug(`existsByProperty: tableName = `, tableName);
        const columnName = EntityUtils.getColumnName(property, metadata.fields);
        LOG.debug(`existsByProperty: columnName = `, columnName);
        const [results] = await this._query(
            EXISTS_BY_COLUMN_QUERY_STRING,
            ['exists', `${this._tablePrefix}${tableName}`, columnName, value]
        );
        // LOG.debug(`existsByProperty: results = `, results);
        if (results.length !== 1) {
            throw new RepositoryError(RepositoryError.Code.EXISTS_INCORRECT_ROW_AMOUNT, `existsById: Incorrect amount of rows in the response`);
        }
        return !!results[0].exists;
    }

    private async _query(
        query: string,
        values ?: any[]
    ): Promise<QueryResultPair> {
        LOG.debug(`query = '${query}'`, values);
        return await new Promise((resolve, reject) => {
            try {
                this._pool.query(
                    {
                        sql: query,
                        values: values,
                        timeout: this._queryTimeout
                    },
                    (error: MysqlError | null, results ?: any, fields?: FieldInfo[]) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve([results, fields]);
                        }
                    }
                );
            } catch (err) {
                reject(err);
            }
        });
    }

}
