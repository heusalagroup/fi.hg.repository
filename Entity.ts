// Copyright (c) 2022-2023. Heusala Group Oy. All rights reserved.
// Copyright (c) 2020-2021. Sendanor. All rights reserved.

import { EntityLike } from "./types/EntityLike";
import { ReadonlyJsonObject } from "../core/Json";
import { EntityUtils } from "./EntityUtils";
import { EntityMetadata } from "./types/EntityMetadata";
import { EntityMetadataUtils } from "./EntityMetadataUtils";

export { Table } from "./Table";
export { Column } from "./Column";
export { Id } from "./Id";

/**
 * Base type for all supported ID types
 */
export type EntityIdTypes = string | number;

export class Entity implements EntityLike {

    public getMetadata (): EntityMetadata {
        return EntityMetadataUtils.getMetadata(this.constructor);
    }

    public toJSON () : ReadonlyJsonObject {
        return EntityUtils.toJSON(this, this.getMetadata());
    }

    public clone () : Entity {
        return EntityUtils.clone(this, this.getMetadata());
    }

}

export function isEntity (value: unknown) : value is Entity {
    return !!value && value instanceof Entity;
}