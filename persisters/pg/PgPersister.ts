// Copyright (c) 2022-2023. Heusala Group Oy. All rights reserved.
// Copyright (c) 2020-2021. Sendanor. All rights reserved.

import { Pool } from "pg";
import { EntityMetadata } from "../../types/EntityMetadata";
import { Persister } from "../../Persister";
import { Entity, EntityIdTypes } from "../../Entity";
import { EntityUtils } from "../../EntityUtils";
import { map } from "../../../core/functions/map";
import { EntityField } from "../../types/EntityField";
import { KeyValuePairs } from "../../types/KeyValuePairs";

/**
 * This persister implements entity store over PostgreSQL database.
 */
export class PgPersister implements Persister {

    private pool: Pool;

    public constructor (
        host: string,
        user: string,
        password: string,
        database: string,
        ssl : boolean | undefined = undefined
    ) {
        this.pool = new Pool(
            {
                host,
                user,
                password,
                database,
                ...(ssl !== undefined ? {ssl} : {})
            }
        );
    }

    public async insert<T extends Entity, ID extends EntityIdTypes> (entity: T | readonly T[], metadata: EntityMetadata): Promise<T> {
        const {tableName} = metadata;
        const fields = metadata.fields.filter((fld) => !this.isIdField(fld, metadata));
        const colNames = fields.map((col) => col.columnName).join(",");
        const values = fields.map((col) => col.propertyName).map((p) => (entity as any)[p]);
        const placeholders = Array.from({length: fields.length}, (_, i) => i + 1)
                                  .map((i) => `$${i}`)
                                  .reduce((prev, curr) => `${prev},${curr}`);
        const insert = `INSERT INTO ${tableName}(${colNames})
                        VALUES (${placeholders}) RETURNING *`;
        try {
            const result = await this.pool.query(insert, values);
            return this.toEntity<T, ID>(result.rows[0], metadata);
        } catch (err) {
            return await Promise.reject(err);
        }
    }

    public async update<T extends Entity, ID extends EntityIdTypes> (entity: T, metadata: EntityMetadata): Promise<T> {
        const {tableName} = metadata;
        const idColName = this.getIdColumnName(metadata);
        const id = this.getId(entity, metadata);
        const fields = metadata.fields.filter((fld) => !this.isIdField(fld, metadata));
        const setters = fields.map((fld, idx) => `${fld.columnName}=$${idx + 2}`).reduce((prev, curr) => `${prev},${curr}`);
        const values = [ id ].concat(fields.map((col) => col.propertyName).map((p) => (entity as any)[p]));
        const update = `UPDATE ${tableName}
                        SET ${setters}
                        WHERE ${idColName} = $1 RETURNING *`;
        try {
            const result = await this.pool.query(update, values);
            return this.toEntity<T, ID>(result.rows[0], metadata);
        } catch (err) {
            return await Promise.reject(err);
        }
    }

    public async delete<T extends Entity, ID extends EntityIdTypes> (entity: T, metadata: EntityMetadata): Promise<void> {
        const {tableName} = metadata;
        const idColName = this.getIdColumnName(metadata);
        const id = this.getId(entity, metadata);
        const sql = `DELETE
                     FROM ${tableName}
                     WHERE ${idColName} = $1 RETURNING *`;
        try {
            return this.pool.query(sql, [ id ]).then();
        } catch (err) {
            return Promise.reject(err);
        }
    }

    public async findAll<T extends Entity, ID extends EntityIdTypes> (metadata: EntityMetadata): Promise<T[]> {
        const {tableName} = metadata;
        const select = `SELECT *
                        FROM ${tableName}`;
        try {
            const result = await this.pool.query(select);
            return result.rows.map((row: any) => this.toEntity(row, metadata));
        } catch (err) {
            return await Promise.reject(err);
        }
    }

    public async findAllById<T extends Entity, ID extends EntityIdTypes> (ids: readonly ID[], metadata: EntityMetadata): Promise<T[]> {
        try {
            const queryParams = map(ids, (item) => item);
            const {tableName} = metadata;
            const idColumnName = this.getIdColumnName(metadata);
            const placeholders = Array.from({length: ids.length}, (_, i) => i + 1)
                                      .map((i) => `$${i}`)
                                      .reduce((prev, curr) => `${prev},${curr}`);
            const select = `SELECT *
                            FROM ${tableName}
                            WHERE ${idColumnName} IN (${placeholders})`;
            const result = await this.pool.query(select, queryParams);
            return result.rows.map((row: any) => this.toEntity(row, metadata));
        } catch (err) {
            return await Promise.reject(err);
        }
    }

    public async findById<T extends Entity, ID extends EntityIdTypes> (id: ID, metadata: EntityMetadata): Promise<T | undefined> {
        const {tableName} = metadata;
        const idColumnName = this.getIdColumnName(metadata);
        const select = `SELECT *
                        FROM ${tableName}
                        WHERE ${idColumnName} = $1`;
        try {
            const result = await this.pool.query(select, [ id ]);
            return this.toEntity<T, ID>(result.rows[0], metadata);
        } catch (err) {
            return await Promise.reject(err);
        }
    }

    public async findAllByProperty<T extends Entity, ID extends EntityIdTypes> (property: string, value: any, metadata: EntityMetadata): Promise<T[]> {
        try {
            const {tableName} = metadata;
            const columnName = this.getColumnName(property, metadata.fields);
            const select = `SELECT *
                            FROM ${tableName}
                            WHERE ${columnName} = $1`;
            const result = await this.pool.query(select, [ value ]);
            return result.rows.map((row: any) => this.toEntity(row, metadata));
        } catch (err) {
            return await Promise.reject(err);
        }
    }

    private toEntity<T extends Entity, ID extends EntityIdTypes> (entity: KeyValuePairs, metadata: EntityMetadata): T {
        return metadata.fields
                       .map((fld) => ({[fld.propertyName]: entity[fld.columnName]}))
                       .reduce((prev, curr) => Object.assign(prev, curr)) as T;
    }

    private getColumnName (propertyName: string, fields: readonly EntityField[]): string {
        return fields.find((x) => x.propertyName === propertyName)?.columnName || "";
    }

    private getIdColumnName (metadata: EntityMetadata) {
        return this.getColumnName(metadata.idPropertyName, metadata.fields);
    }

    private getId (entity: KeyValuePairs, metadata: EntityMetadata) {
        return entity[metadata.idPropertyName];
    }

    private isIdField (field: EntityField, metadata: EntityMetadata) {
        return field.propertyName === metadata.idPropertyName;
    }

    public count<T extends Entity, ID extends EntityIdTypes> (metadata: EntityMetadata): Promise<number> {
        throw new TypeError('PgPersister.count: Not implemented yet');
        // return Promise.resolve(0);
    }

    public countByProperty<T extends Entity, ID extends EntityIdTypes> (property: string, value: any, metadata: EntityMetadata): Promise<number> {
        throw new TypeError('PgPersister.countByProperty: Not implemented yet');
        // return Promise.resolve(0);
    }

    public deleteAll<T extends Entity, ID extends EntityIdTypes> (metadata: EntityMetadata): Promise<void> {
        const {tableName} = metadata;
        const sql = `DELETE FROM ${tableName}`;
        try {
            return this.pool.query(sql, []).then();
        } catch (err) {
            return Promise.reject(err);
        }
    }

    public deleteAllById<T extends Entity, ID extends EntityIdTypes> (ids: readonly ID[], metadata: EntityMetadata): Promise<void> {
        throw new TypeError('PgPersister.deleteAllById: Not implemented yet');
        // return Promise.resolve(undefined);
    }

    public deleteAllByProperty<T extends Entity, ID extends EntityIdTypes> (property: string, value: any, metadata: EntityMetadata): Promise<void> {
        throw new TypeError('PgPersister.deleteAllByProperty: Not implemented yet');
        // return Promise.resolve(undefined);
    }

    public async deleteById<T extends Entity, ID extends EntityIdTypes> (id: ID, metadata: EntityMetadata): Promise<void> {
        const {tableName} = metadata;
        const idColumnName = this.getIdColumnName(metadata);
        const query = `DELETE
                        FROM ${tableName}
                        WHERE ${idColumnName} = $1`;
        try {
            await this.pool.query(query, [ id ]);
        } catch (err) {
            return await Promise.reject(err);
        }
    }

    public existsByProperty<T extends Entity, ID extends EntityIdTypes> (property: string, value: any, metadata: EntityMetadata): Promise<boolean> {
        throw new TypeError('PgPersister.existsByProperty: Not implemented yet');
        // return Promise.resolve(false);
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
        try {
            const result = await this.pool.query(select, [ value ]);
            return this.toEntity<T, ID>(result.rows[0], metadata);
        } catch (err) {
            return await Promise.reject(err);
        }
    }

}
