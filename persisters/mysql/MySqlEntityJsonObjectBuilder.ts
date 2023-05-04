// Copyright (c) 2023. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import { EntityField } from "../../types/EntityField";
import { QueryBuilder } from "./QueryBuilder";
import { MySqlJsonObjectQueryBuilder } from "./MySqlJsonObjectQueryBuilder";
import { EntityFieldType } from "../../types/EntityFieldType";

export class MySqlEntityJsonObjectBuilder implements QueryBuilder {

    private readonly _jsonBuilder : MySqlJsonObjectQueryBuilder;

    public constructor (
    ) {
        this._jsonBuilder = new MySqlJsonObjectQueryBuilder();
    }

    public setEntityFieldsFromTable (
        tableName : string,
        fields : readonly EntityField[]
    ) {
        fields.forEach(
            (field: EntityField) => {
                const {columnName, fieldType} = field;
                if (fieldType !== EntityFieldType.JOINED_ENTITY) {
                    this._jsonBuilder.setPropertyFromColumn(
                        columnName,
                        tableName,
                        columnName
                    );
                }
            }
        );
    }

    public build (): [ string, any[] ] {
        return [ this.buildQueryString(), this.buildQueryValues() ];
    }

    public buildQueryString (): string {
        return this._jsonBuilder.buildQueryString();
    }

    public buildQueryValues (): any[] {
        return this._jsonBuilder.buildQueryValues();
    }

    public getQueryValueFactories (): (() => any)[] {
        return this._jsonBuilder.getQueryValueFactories();
    }

}
