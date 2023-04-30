// Copyright (c) 2022-2023. Heusala Group Oy. All rights reserved.
// Copyright (c) 2020-2021. Sendanor. All rights reserved.

import "reflect-metadata";
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
