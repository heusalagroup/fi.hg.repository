// Copyright (c) 2022-2023. Heusala Group Oy. All rights reserved.
// Copyright (c) 2020-2021. Sendanor. All rights reserved.

import { EntityFieldType, parseEntityFieldType } from "./EntityFieldType";
import { EntityMetadata } from "./EntityMetadata";
import { toUpper } from "../../core/functions/toUpper";

export interface EntityField {

    fieldType : EntityFieldType;

    /**
     * The property name on the class
     */
    propertyName : string;

    /**
     * The field name in the database table
     */
    columnName   : string;

    /**
     * The database column definition.
     *
     * E.g. `BIGINT`.
     */
    columnDefinition ?: string;

    /**
     * If enabled, this field can be left undefined.
     *
     * Default is `true`.
     */
    nullable   : boolean;

    /**
     * The field metadata if this field is an entity
     */
    metadata   ?: EntityMetadata | undefined;

}

export function createEntityField (
    propertyName : string,
    columnName   : string,
    columnDefinition ?: string,
    nullable    ?: boolean | undefined,
    fieldType   ?: EntityFieldType | undefined,
    metadata    ?: EntityMetadata | undefined,
) : EntityField {
    return {
        propertyName,
        columnName,
        ...(columnDefinition ? {columnDefinition: toUpper(columnDefinition)} : {}),
        nullable : nullable ?? true,
        fieldType : parseEntityFieldType(fieldType) ?? EntityFieldType.UNKNOWN,
        ...(metadata ? {metadata} : {})
    };
}
