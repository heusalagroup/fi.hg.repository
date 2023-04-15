// Copyright (c) 2020, 2021 Sendanor. All rights reserved.

import { Entity, EntityIdTypes } from "./Entity";
import { EntityMetadata, EntityField, KeyValuePairs } from "./types/EntityMetadata";
import { RepositoryError } from "./types/RepositoryError";
import { trim } from "../core/functions/trim";
import { isString } from "../core/types/String";

export class EntityUtils {

    public static getColumnName (
        propertyName : string,
        fields       : EntityField[]
    ): string {

        const field = fields.find((x: EntityField) => x.propertyName === propertyName);

        if (field) {
            return field.columnName;
        }

        throw new RepositoryError(RepositoryError.Code.COLUMN_NAME_NOT_FOUND, `Column name not found for property: "${propertyName}"`);

    }

    public static getPropertyName (
        columnName : string,
        fields     : EntityField[]
    ): string {

        const field = fields.find((x: EntityField) => x.columnName === columnName);

        if (field) {
            return field.propertyName;
        }

        throw new RepositoryError(RepositoryError.Code.PROPERTY_NAME_NOT_FOUND, `Column not found: "${columnName}"`);

    }

    public static toEntity<T extends Entity, ID extends EntityIdTypes> (
        entity: KeyValuePairs,
        metadata: EntityMetadata
    ): T {
        return (
            metadata.fields
                .map((fld) => ({[fld.propertyName]: entity[fld.columnName]}))
                .reduce((prev, curr) => Object.assign(prev, curr)) as T
        );
    }

    public static getIdColumnName (metadata: EntityMetadata) : string {
        return EntityUtils.getColumnName(metadata.idPropertyName, metadata.fields);
    }

    public static getIdPropertyName (metadata: EntityMetadata) : string {
        return metadata.idPropertyName;
    }

    public static getId<T extends Entity, ID extends EntityIdTypes> (
        entity      : T,
        metadata    : EntityMetadata,
        tablePrefix : string = ''
    ): ID {

        const id = (entity as KeyValuePairs)[metadata.idPropertyName];

        if (id !== undefined) return id;

        throw new RepositoryError(RepositoryError.Code.ID_NOT_FOUND_FOR_TABLE, `Id property not found for table: "${tablePrefix}${metadata.tableName}"`);

    }

    public static isIdField (
        field: EntityField,
        metadata: EntityMetadata
    ) {
        return field.propertyName === metadata.idPropertyName;
    }

    public static parseStringArray (
        input: string | undefined,
        separator: string
    ) : string[] {
        return (input ?? '').split(separator).map(trim).filter((item: string) => !!item);
    }

    public static parseBoolean (input : any) : boolean {
        return input === true || input === 1;
    }

    public static parseString (input : any) : string {
        return isString(input) ? input : '';
    }

    public static parseIntegerAsString (input : string | number | undefined) : string | undefined {
        if ( (isString(input) && trim(input)) === '' || input === undefined ) return undefined;
        return `${input}`;
    }

    public static parseDateAsString (input : Date | string | undefined) : string | undefined {
        if ( (isString(input) && trim(input)) === '' || input === undefined ) return undefined;
        return `${input}`;
    }


}
