// Copyright (c) 2022-2023. Heusala Group Oy. All rights reserved.
// Copyright (c) 2020-2021. Sendanor. All rights reserved.

import "reflect-metadata";
import { CreateEntityLikeCallback } from "./EntityLike";
import { EntityField } from "./EntityField";
import { EntityRelation } from "./EntityRelation";

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

    relations : EntityRelation[];

    createEntity : CreateEntityLikeCallback | undefined;

}

export function createEntityMetadata (
    tableName      : string,
    idPropertyName : string,
    fields         : EntityField[],
    relations      : EntityRelation[],
    createEntity   : CreateEntityLikeCallback | undefined,
) {
    return {
        tableName,
        idPropertyName,
        fields,
        relations,
        createEntity
    };
}
