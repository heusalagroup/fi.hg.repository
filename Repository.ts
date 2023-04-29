// Copyright (c) 2022-2023. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.
// Copyright (c) 2020-2021. Sendanor. All rights reserved.

import { Persister } from "./Persister";
import { Repository } from "./types/Repository";
import { CrudRepositoryImpl } from "./types/CrudRepositoryImpl";
import { Entity, EntityIdTypes } from "./Entity";
import { RepositoryUtils } from "./RepositoryUtils";
import { EntityMetadata } from "./types/EntityMetadata";
import { LogService } from "../core/LogService";
import { LogLevel } from "../core/types/LogLevel";

const LOG = LogService.createLogger('Repository');

export function setRepositoryLogLevel (level: LogLevel) {
    LOG.setLogLevel(level);
}

export function createCrudRepositoryWithPersister<
    T extends Entity,
    ID extends EntityIdTypes,
    RepositoryType extends Repository<T, ID>
> (
    emptyEntity : T,
    persister   : Persister
) : RepositoryType {
    const entityMetadata : EntityMetadata = emptyEntity.getMetadata();
    LOG.debug(`entityMetadata = `, entityMetadata);

    class FinalCrudRepositoryImpl<T extends Entity, ID extends EntityIdTypes>
        extends CrudRepositoryImpl<T, ID> {

        constructor (
            persister : Persister
        ) {
            super(entityMetadata, persister);
        }

    }

    const newImpl = new FinalCrudRepositoryImpl(persister);
    RepositoryUtils.generateDefaultMethods<T, ID, RepositoryType>(FinalCrudRepositoryImpl.prototype, entityMetadata);
    return newImpl as unknown as RepositoryType;
}
