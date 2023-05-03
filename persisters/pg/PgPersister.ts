// Copyright (c) 2022-2023. Heusala Group Oy. All rights reserved.
// Copyright (c) 2020-2021. Sendanor. All rights reserved.

import { Pool, QueryResult } from "pg";
import { EntityMetadata } from "../../types/EntityMetadata";
import { Persister } from "../../Persister";
import { Entity, EntityIdTypes } from "../../Entity";
import { EntityUtils } from "../../EntityUtils";
import { map } from "../../../core/functions/map";
import { EntityField } from "../../types/EntityField";
import { KeyValuePairs } from "../../types/KeyValuePairs";
import { first } from "../../../core/functions/first";
import { reduce } from "../../../core/functions/reduce";
import { LogService } from "../../../core/LogService";
import { LogLevel } from "../../../core/types/LogLevel";
import { isSafeInteger } from "../../../core/types/Number";

const LOG = LogService.createLogger('PgPersister');

/**
 * This persister implements entity store over PostgreSQL database.
 */
export class PgPersister implements Persister {

    public static setLogLevel (level: LogLevel) {
        LOG.setLogLevel(level);
    }

    private _pool: Pool;

    public constructor (
        host: string,
        user: string,
        password: string,
        database: string,
        ssl : boolean | undefined = undefined
    ) {
        this._pool = new Pool(
            {
                host,
                user,
                password,
                database,
                ...(ssl !== undefined ? {ssl} : {})
            }
        );
    }

    public destroy () {}

    public setupEntityMetadata (metadata: EntityMetadata) : void {

    }

    public async insert<T extends Entity, ID extends EntityIdTypes> (entity: T | readonly T[], metadata: EntityMetadata): Promise<T> {
        const {tableName} = metadata;
        const fields = metadata.fields.filter((fld) => !this._isIdField(fld, metadata));
        const colNames = fields.map((col) => col.columnName).join(",");
        const values = fields.map((col) => col.propertyName).map((p) => (entity as any)[p]);
        const placeholders = Array.from({length: fields.length}, (_, i) => i + 1)
                                  .map((i) => `$${i}`)
                                  .reduce((prev, curr) => `${prev},${curr}`);
        const insert = `INSERT INTO ${tableName}(${colNames})
                        VALUES (${placeholders}) RETURNING *`;
        const result = await this._query(insert, values);
        if (!result) throw new TypeError(`Result was not defined: ${result}`);
        const rows = result.rows;
        if (!rows) throw new TypeError(`Result rows was not defined: ${rows}`);
        const row = first(rows);
        if (!row) throw new TypeError(`Result row was not found: ${rows}`);
        return this._toEntity<T, ID>(row, metadata);
    }

    public async update<T extends Entity, ID extends EntityIdTypes> (entity: T, metadata: EntityMetadata): Promise<T> {
        const {tableName} = metadata;
        const idColName = this._getIdColumnName(metadata);
        const id = this._getId(entity, metadata);
        const fields = metadata.fields.filter((fld) => !this._isIdField(fld, metadata));
        const setters = fields.map((fld, idx) => `${fld.columnName}=$${idx + 2}`).reduce((prev, curr) => `${prev},${curr}`);
        const values = [ id ].concat(fields.map((col) => col.propertyName).map((p) => (entity as any)[p]));
        const update = `UPDATE ${tableName}
                        SET ${setters}
                        WHERE ${idColName} = $1 RETURNING *`;
        const result = await this._query(update, values);
        if (!result) throw new TypeError(`Result was not defined: ${result}`);
        const rows = result.rows;
        if (!rows) throw new TypeError(`Result rows was not defined: ${rows}`);
        const row = first(rows);
        if (!row) throw new TypeError(`Result row was not found: ${rows}`);
        return this._toEntity<T, ID>(row, metadata);
    }

    public async delete<T extends Entity, ID extends EntityIdTypes> (entity: T, metadata: EntityMetadata): Promise<void> {
        const {tableName} = metadata;
        const idColName = this._getIdColumnName(metadata);
        const id = this._getId(entity, metadata);
        const sql = `DELETE
                     FROM ${tableName}
                     WHERE ${idColName} = $1 RETURNING *`;
        await this._query(sql, [ id ]);
    }

    public async findAll<T extends Entity, ID extends EntityIdTypes> (metadata: EntityMetadata): Promise<T[]> {
        const {tableName} = metadata;
        const select = `SELECT *
                        FROM ${tableName}`;
        const result = await this._query(select, []);
        return result.rows.map((row: any) => this._toEntity(row, metadata));
    }

    public async findAllById<T extends Entity, ID extends EntityIdTypes> (ids: readonly ID[], metadata: EntityMetadata): Promise<T[]> {
        const queryParams = map(ids, (item) => item);
        const {tableName} = metadata;
        const idColumnName = this._getIdColumnName(metadata);
        const placeholders = Array.from({length: ids.length}, (_, i) => i + 1)
                                  .map((i) => `$${i}`)
                                  .reduce((prev, curr) => `${prev},${curr}`);
        const select = `SELECT *
                        FROM ${tableName}
                        WHERE ${idColumnName} IN (${placeholders})`;
        const result = await this._query(select, queryParams);
        return result.rows.map((row: any) => this._toEntity(row, metadata));
    }

    public async findById<T extends Entity, ID extends EntityIdTypes> (id: ID, metadata: EntityMetadata): Promise<T | undefined> {
        const {tableName} = metadata;
        const idColumnName = this._getIdColumnName(metadata);
        const select = `SELECT *
                        FROM ${tableName}
                        WHERE ${idColumnName} = $1`;
        const result = await this._query(select, [ id ]);
        if (!result) throw new TypeError(`Result was not defined: ${result}`);
        const rows = result.rows;
        if (!rows) throw new TypeError(`Result rows was not defined: ${rows}`);
        const row = first(rows);
        if (!row) return undefined;
        return this._toEntity<T, ID>(row, metadata);
    }

    public async findAllByProperty<T extends Entity, ID extends EntityIdTypes> (property: string, value: any, metadata: EntityMetadata): Promise<T[]> {
        const {tableName} = metadata;
        const columnName = this._getColumnName(property, metadata.fields);
        const select = `SELECT *
                        FROM ${tableName}
                        WHERE ${columnName} = $1`;
        const result = await this._query(select, [ value ]);
        return result.rows.map((row: any) => this._toEntity(row, metadata));
    }

    private _toEntity<T extends Entity, ID extends EntityIdTypes> (
        entity: KeyValuePairs,
        metadata: EntityMetadata
    ): T {
        if (!entity) throw new TypeError(`Entity was not defined: ${entity}`);
        if (!metadata) throw new TypeError(`Entity metadata was not defined: ${metadata}`);
        return metadata.fields
                       .map((fld) => ({[fld.propertyName]: entity[fld.columnName]}))
                       .reduce((prev, curr) => Object.assign(prev, curr)) as T;
    }

    private _getColumnName (propertyName: string, fields: readonly EntityField[]): string {
        return fields.find((x) => x.propertyName === propertyName)?.columnName || "";
    }

    private _getIdColumnName (metadata: EntityMetadata) {
        return this._getColumnName(metadata.idPropertyName, metadata.fields);
    }

    private _getId (entity: KeyValuePairs, metadata: EntityMetadata) {
        return entity[metadata.idPropertyName];
    }

    private _isIdField (field: EntityField, metadata: EntityMetadata) {
        return field.propertyName === metadata.idPropertyName;
    }

    public async count<T extends Entity, ID extends EntityIdTypes> (metadata: EntityMetadata): Promise<number> {
        const {tableName} = metadata;
        const sql = `SELECT COUNT(*) as count FROM ${tableName}`;
        const result = await this._query(sql, []);
        if (!result) throw new TypeError('Could not get result for PgPersister.countByProperty');
        LOG.debug(`count: result = `, result);
        const rows = result.rows;
        LOG.debug(`count: rows = `, rows);
        if (!rows) throw new TypeError('Could not get result rows for PgPersister.countByProperty');
        const row = first(rows);
        LOG.debug(`count: row = `, row);
        if (!row) throw new TypeError('Could not get result row for PgPersister.countByProperty');
        const count = row.count;
        LOG.debug(`count: count = `, count);
        if (!count) throw new TypeError('Could not read count for PgPersister.countByProperty');
        const parsedCount = parseInt(count, 10);
        if (!isSafeInteger(parsedCount)) throw new TypeError(`Could not read count for PgPersister.countByProperty`);
        return parsedCount;
    }

    public async countByProperty<T extends Entity, ID extends EntityIdTypes> (property: string, value: any, metadata: EntityMetadata): Promise<number> {
        const {tableName} = metadata;
        const columnName = EntityUtils.getColumnName(property, metadata.fields);
        const sql = `SELECT COUNT(*) as count FROM ${tableName} WHERE ${columnName} = $1`;
        const result = await this._query(sql, [value]);
        LOG.debug(`countByProperty: result = `, result);
        if (!result) throw new TypeError('Could not get result for PgPersister.countByProperty');
        const rows = result.rows;
        LOG.debug(`count: rows = `, rows);
        if (!rows) throw new TypeError('Could not get result rows for PgPersister.countByProperty');
        const row = first(rows);
        LOG.debug(`count: row = `, row);
        if (!row) throw new TypeError('Could not get result row for PgPersister.countByProperty');
        const count = row.count;
        LOG.debug(`count: count = `, count);
        if (!count) throw new TypeError('Could not read count for PgPersister.countByProperty');
        const parsedCount = parseInt(count, 10);
        if (!isSafeInteger(parsedCount)) throw new TypeError(`Could not read count for PgPersister.countByProperty`);
        return parsedCount;
    }

    public async deleteAll<T extends Entity, ID extends EntityIdTypes> (metadata: EntityMetadata): Promise<void> {
        const {tableName} = metadata;
        const sql = `DELETE FROM ${tableName}`;
        await this._query(sql, []);
    }

    /**
     *
     * @param ids
     * @param metadata
     * @FIXME This could be improved as single query
     */
    public async deleteAllById<T extends Entity, ID extends EntityIdTypes> (ids: readonly ID[], metadata: EntityMetadata): Promise<void> {
        await reduce(
            ids,
            async (prev: Promise<void>, id: ID) => {
                await prev;
                await this.deleteById(id, metadata);
            },
            Promise.resolve()
        );
    }

    public async deleteAllByProperty<T extends Entity, ID extends EntityIdTypes> (
        property: string,
        value: any,
        metadata: EntityMetadata
    ): Promise<void> {
        const {tableName} = metadata;
        const columnName = EntityUtils.getColumnName(property, metadata.fields);
        const select = `DELETE
                        FROM ${tableName}
                        WHERE ${columnName} = $1`;
        await this._query(select, [ value ]);
    }

    public async deleteById<T extends Entity, ID extends EntityIdTypes> (id: ID, metadata: EntityMetadata): Promise<void> {
        const {tableName} = metadata;
        const idColumnName = this._getIdColumnName(metadata);
        const query = `DELETE
                        FROM ${tableName}
                        WHERE ${idColumnName} = $1`;
        await this._query(query, [ id ]);
    }

    public async existsByProperty<T extends Entity, ID extends EntityIdTypes> (property: string, value: any, metadata: EntityMetadata): Promise<boolean> {
        const count = await this.countByProperty(property, value, metadata);
        return count >= 1;
    }

    public async findByProperty<T extends Entity, ID extends EntityIdTypes> (
        property: string,
        value: any,
        metadata: EntityMetadata
    ): Promise<T | undefined> {
        const {tableName} = metadata;
        const columnName = EntityUtils.getColumnName(property, metadata.fields);
        const select = `SELECT *
                        FROM ${tableName}
                        WHERE ${columnName} = $1`;
        const result = await this._query(select, [ value ]);
        if (!result) throw new TypeError(`Result was not defined: ${result}`);
        const rows = result.rows;
        if (!rows) throw new TypeError(`Result rows was not defined: ${rows}`);
        const row = first(rows);
        if (!row) return undefined;
        return this._toEntity<T, ID>(row, metadata);
    }

    private async _query (
        query: string,
        values: any[]
    ) : Promise<QueryResult<any>> {
        LOG.debug(`Query "${query}" with values: `, values);
        return await this._pool.query(query, values);
    }

}
