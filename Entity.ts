// Copyright (c) 2022-2023. Heusala Group Oy. All rights reserved.
// Copyright (c) 2020-2021. Sendanor. All rights reserved.

import "reflect-metadata";
import { EntityField, EntityMetadata } from "./types/EntityMetadata";
import { isString } from "../core/types/String";
import { CreateEntityLikeCallback, EntityLike } from "./types/EntityLike";
import { reduce } from "../core/functions/reduce";
import { isReadonlyJsonAny, ReadonlyJsonAny, ReadonlyJsonObject } from "../core/Json";
import { isFunction } from "../core/types/Function";
import { EntityUtils } from "./EntityUtils";

const metadataKey = Symbol("metadata");

function updateMetadata(target: any, setValue: (metadata: EntityMetadata) => void) : void {
    const metadata: EntityMetadata = Reflect.getMetadata(metadataKey, target) || {
        tableName: "",
        idPropertyName: "",
        fields: [],
        createEntity: () => undefined
    };
    setValue(metadata);
    Reflect.defineMetadata(metadataKey, metadata, target);
}

export const Table = (tableName: string) => {
    return (target: any) => {
        const TargetEntity = target;
        updateMetadata(target, (metadata: EntityMetadata) => {
            metadata.tableName = tableName;
            metadata.createEntity = (dto?: any) => {
                return new TargetEntity(dto);
            };
        });
    };
};

export const Column = (columnName: string): PropertyDecorator => {
    return (target: any, propertyName : string | symbol) => {
        if (!isString(propertyName)) throw new TypeError(`Only string properties supported. The type was ${typeof propertyName}.`);
        updateMetadata(target.constructor, (metadata: EntityMetadata) => {
            metadata.fields.push({ propertyName, columnName });
        });
    };
};

export const Id = (): PropertyDecorator => {
    return (target: any, propertyName : string | symbol) => {
        if (!isString(propertyName)) throw new TypeError(`Only string properties supported. The type was ${typeof propertyName}.`);
        updateMetadata(target.constructor, (metadata: EntityMetadata) => {
            metadata.idPropertyName = propertyName;
        });
    };
};

export class Entity implements EntityLike {

    public getMetadata(): EntityMetadata {
        return Reflect.getMetadata(metadataKey, this.constructor);
    }

    public toJSON () : ReadonlyJsonObject {
        return EntityUtils.toJSON(this, this.getMetadata());
    }

    public clone () : Entity {
        return EntityUtils.clone(this, this.getMetadata());
    }

}

/**
 * Base type for all supported ID types
 */
export type EntityIdTypes = string | number;
