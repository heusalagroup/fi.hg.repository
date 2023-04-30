// Copyright (c) 2022-2023. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.
// Copyright (c) 2020-2021. Sendanor. All rights reserved.

import { Entity, EntityIdTypes } from "./Entity";
import { Repository } from "./types/Repository";

export interface CrudRepository<T extends Entity, IdType extends EntityIdTypes>
    extends Repository<T, IdType>
{

}
