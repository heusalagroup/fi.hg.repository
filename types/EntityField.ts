// Copyright (c) 2022-2023. Heusala Group Oy. All rights reserved.
// Copyright (c) 2020-2021. Sendanor. All rights reserved.

import { EntityFieldType, parseEntityFieldType } from "./EntityFieldType";

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
     * If enabled, this field can be left undefined.
     *
     * Default is `true`.
     */
    nullable   : boolean;

}

export function createEntityField (
    propertyName : string,
    columnName   : string,
    nullable    ?: boolean | undefined,
    fieldType   ?: EntityFieldType | undefined
) : EntityField {
    return {
        propertyName,
        columnName,
        nullable : nullable ?? true,
        fieldType : parseEntityFieldType(fieldType) ?? EntityFieldType.UNKNOWN
    };
}
