// Copyright (c) 2023. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import { isString } from "../core/types/String";
import { RepositoryMetadataUtils } from "./RepositoryMetadataUtils";
import { EntityMetadata } from "./types/EntityMetadata";

export const Id = (): PropertyDecorator => {
    return (target: any, propertyName : string | symbol) => {
        if (!isString(propertyName)) throw new TypeError(`Only string properties supported. The type was ${typeof propertyName}.`);
        RepositoryMetadataUtils.updateMetadata(target.constructor, (metadata: EntityMetadata) => {
            metadata.idPropertyName = propertyName;
        });
    };
};
