// Copyright (c) 2022-2023. Heusala Group Oy. All rights reserved.
// Copyright (c) 2020-2021. Sendanor. All rights reserved.

import "reflect-metadata";
import { CreateEntityLikeCallback, EntityLike } from "./EntityLike";

export interface EntityField {

    /**
     * The property name on the class
     */
    propertyName : string;

    /**
     * The field name in the database table
     */
    columnName   : string;

}

export function createEntityField (
    propertyName : string,
    columnName   : string
) {
    return {
        propertyName,
        columnName
    };
}

export interface EntityMetadata {

    /**
     * The SQL table name
     */
    tableName      : string;

    /**
     * The property name of the primary key
     */
    idPropertyName : string;

    /**
     * Metadata for fields
     */
    fields         : EntityField[];

    createEntity : CreateEntityLikeCallback | undefined;

}

export function createEntityMetadata (
    tableName      : string,
    idPropertyName : string,
    fields         : EntityField[],
    createEntity   : CreateEntityLikeCallback | undefined
) {
    return {
        tableName,
        idPropertyName,
        fields,
        createEntity
    };
}

export interface KeyValuePairs {
    [key: string]: any;
}
