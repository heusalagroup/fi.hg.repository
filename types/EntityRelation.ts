// Copyright (c) 2022-2023. Heusala Group Oy. All rights reserved.
// Copyright (c) 2020-2021. Sendanor. All rights reserved.

export interface EntityRelation {

    /**
     * The property name on the class
     */
    propertyName : string;

}

export function createEntityRelation (
    propertyName : string
) {
    return {
        propertyName
    };
}
