// Copyright (c) 2023. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import { createRepositoryTestContext, RepositoryTestContext } from "../types/RepositoryTestContext";
import { basicCrudTests } from "./basicCrudTests";
import { entityRelationshipTests } from "./entityRelationshipTests";
import { Persister } from "../../Persister";

export const allRepositoryTests = (
    createPersister : () => Persister
) => {

    let context : RepositoryTestContext = createRepositoryTestContext();

    beforeEach(() => {
        context.persister = createPersister();
    });

    describe('CRUD operations', () => {
        basicCrudTests(context);
    });

    describe('Entity relationships', () => {
        entityRelationshipTests(context);
    });

};
