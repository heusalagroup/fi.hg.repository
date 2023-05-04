// Copyright (c) 2023. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import { LogService } from "../../../core/LogService";
import map from "lodash/map";
import { QueryBuilder } from "./QueryBuilder";
import { SelectQueryBuilder } from "./SelectQueryBuilder";
import { forEach } from "../../../core/functions/forEach";

const LOG = LogService.createLogger('MySqlSelectQueryBuilder');

export class MySqlSelectQueryBuilder implements SelectQueryBuilder {

    private _mainIdColumnName : string | undefined;
    private _mainTableName : string | undefined;
    private _tablePrefix : string = '';
    private _fieldQueries : (() => string)[];
    private _fieldValues : (() => any)[];
    private _leftJoinQueries : (() => string)[];
    private _leftJoinValues : (() => any)[];
    private _where : QueryBuilder | undefined;

    public constructor () {
        this._mainIdColumnName = undefined;
        this._mainTableName = undefined;
        this._where = undefined;
        this._tablePrefix = '';
        this._fieldQueries = [];
        this._fieldValues = [];
        this._leftJoinQueries = [];
        this._leftJoinValues = [];
    }

    public setTablePrefix (prefix: string) {
        this._tablePrefix = prefix;
    }

    public getTablePrefix (): string {
        return this._tablePrefix;
    }

    public getCompleteTableName (tableName : string) : string {
        return `${this._tablePrefix}${tableName}`;
    }

    public setWhereFromQueryBuilder (builder: QueryBuilder): void {
        this._where = builder;
    }

    public includeAllColumnsFromTable (tableName: string) {
        this._fieldQueries.push(() => '??.*');
        this._fieldValues.push(() => this.getCompleteTableName(tableName));
    }

    public includeColumnFromQueryBuilder (
        builder: QueryBuilder,
        asColumnName: string
    ) {
        this._fieldQueries.push(() => {
            const query = builder.buildQueryString();
            if (!query) throw new TypeError(`Query builder failed to create query string`);
            return `${query} AS ??`;
        });
        forEach(
            builder.getQueryValueFactories(),
            (item) => {
                this._fieldValues.push(item);
            }
        );
        this._fieldValues.push(() => asColumnName);
    }

    public includeFormulaByString (
        formula: string,
        asColumnName: string
    ): void {
        if (!formula) {
            throw new TypeError(`includeFormulaByString: formula is required`);
        }
        if (!asColumnName) {
            throw new TypeError(`includeFormulaByString: column name is required`);
        }
        this._fieldQueries.push(() => `${formula} AS ??`);
        this._fieldValues.push(() => asColumnName);
    }

    public setFromTable (tableName: string) {
        this._mainTableName = tableName;
    }

    public getCompleteFromTable (): string {
        if (!this._mainTableName) throw new TypeError(`From table has not been initialized yet`);
        return this.getCompleteTableName(this._mainTableName);
    }

    public getShortFromTable (): string {
        if (!this._mainTableName) throw new TypeError(`From table has not been initialized yet`);
        return this._mainTableName;
    }

    public setGroupByColumn (columnName: string) {
        this._mainIdColumnName = columnName;
    }

    public getGroupByColumn (): string {
        if (!this._mainIdColumnName) throw new TypeError(`Group by has not been initialized yet`);
        return this._mainIdColumnName;
    }

    public leftJoinTable (
        fromTableName : string,
        fromColumnName : string,
        sourceTableName : string,
        sourceColumnName : string
    ) {
        this._leftJoinQueries.push(() => `LEFT JOIN ?? ON ??.?? = ??.??`);
        this._leftJoinValues.push( () => this.getCompleteTableName(fromTableName));
        this._leftJoinValues.push( () => this.getCompleteTableName(sourceTableName));
        this._leftJoinValues.push( () => sourceColumnName);
        this._leftJoinValues.push( () => this.getCompleteTableName(fromTableName));
        this._leftJoinValues.push( () => fromColumnName);
    }

    public build () : [string, any[]] {
        return [this.buildQueryString(), this.buildQueryValues()];
    }

    public buildQueryString () : string {
        const fieldQueries = map(this._fieldQueries, (f) => f());
        const leftJoinQueries = map(this._leftJoinQueries, (f) => f());
        let query = `SELECT ${fieldQueries.join(', ')}`;
        if (this._mainTableName) {
            query += ` FROM ??`;
        }
        if (leftJoinQueries.length) {
            query += ` ${leftJoinQueries.join(' ')}`;
        }
        if (this._where) {
            query += ` WHERE ${this._where.buildQueryString()}`;
        }
        if ( this._mainIdColumnName ) {
            if (!this._mainTableName) throw new TypeError(`No table initialized`);
            query += ` GROUP BY ??.??`;
        }
        return query;
    }

    public buildQueryValues () : any[] {
        const fieldValues = map(this._fieldValues, (f) => f());
        const leftJoinValues = map(this._leftJoinValues, (f) => f());
        return [
            ...fieldValues,
            ...( this._mainTableName ? [this._mainTableName] : []),
            ...leftJoinValues,
            ...( this._where ? this._where.buildQueryValues() : []),
            ...( this._mainTableName && this._mainIdColumnName ? [
                this._mainTableName,
                this._mainIdColumnName
            ] : [])
        ];
    }

    public getQueryValueFactories (): (() => any)[] {
        return [
            ...this._fieldValues,
            ...( this._mainTableName ? [() => this._mainTableName] : []),
            ...this._leftJoinValues,
            ...( this._where ? this._where.getQueryValueFactories() : []),
            ...( this._mainTableName && this._mainIdColumnName ? [
                () => this._mainTableName,
                () => this._mainIdColumnName
            ] : [])
        ]
    }

}
