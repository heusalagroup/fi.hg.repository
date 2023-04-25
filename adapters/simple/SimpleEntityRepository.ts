// Copyright (c) 2020-2023. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import { SimpleEntity } from "./SimpleEntity";
import { Repository } from "../../types/Repository";

export interface SimpleEntityRepository extends Repository<SimpleEntity, string> {
    findAllByEntityDeleted (deleted: boolean)  : Promise<SimpleEntity[]>;
}
