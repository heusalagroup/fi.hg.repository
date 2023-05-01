// Copyright (c) 2022-2023. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.
// Copyright (c) 2020-2021. Sendanor. All rights reserved.

import { Entity, EntityIdTypes } from "./Entity";
import { Repository } from "./types/Repository";
import { LogService } from "../core/LogService";
import { LogLevel } from "../core/types/LogLevel";
import { Persister } from "./Persister";
import { EntityMetadata } from "./types/EntityMetadata";
import { CrudRepositoryImpl } from "./types/CrudRepositoryImpl";
import { RepositoryUtils } from "./RepositoryUtils";

const LOG = LogService.createLogger('CrudRepository');

export interface CrudRepository<T extends Entity, IdType extends EntityIdTypes>
    extends Repository<T, IdType>
{

}

export function setCrudRepositoryLogLevel (level: LogLevel) {
    LOG.setLogLevel(level);
}

export function createCrudRepositoryWithPersister<
    T extends Entity,
    ID extends EntityIdTypes,
    RepositoryType extends CrudRepository<T, ID>
> (
    emptyEntity: T,
    persister: Persister
): RepositoryType {
    const entityMetadata: EntityMetadata = emptyEntity.getMetadata();
    LOG.debug(`entityMetadata = `, entityMetadata);

    persister.setupEntityMetadata(entityMetadata);

    class FinalCrudRepositoryImpl<T extends Entity, ID extends EntityIdTypes>
        extends CrudRepositoryImpl<T, ID> {

        constructor (
            persister: Persister
        ) {
            super(entityMetadata, persister);
        }

    }

    const newImpl = new FinalCrudRepositoryImpl(persister);
    RepositoryUtils.generateDefaultMethods<T, ID, RepositoryType>(FinalCrudRepositoryImpl.prototype, entityMetadata);

    return newImpl as unknown as RepositoryType;
}
