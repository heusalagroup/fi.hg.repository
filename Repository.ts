// Copyright (c) 2022-2023. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.
// Copyright (c) 2020-2021. Sendanor. All rights reserved.

import { Entity, EntityIdTypes } from "./Entity";
import { CrudRepository } from "./CrudRepository";
import { Persister } from "./Persister";

import { createCrudRepositoryWithPersister as _createCrudRepositoryWithPersister } from "./CrudRepository";

/**
 * Moved to another file name. Import directly from `./CrudRepository`.
 *
 * @param emptyEntity
 * @param persister
 * @deprecated
 */
export function createCrudRepositoryWithPersister<
    T extends Entity,
    ID extends EntityIdTypes,
    RepositoryType extends CrudRepository<T, ID>
> (    emptyEntity: T,
       persister: Persister
): RepositoryType {
    return _createCrudRepositoryWithPersister(emptyEntity, persister);
}
