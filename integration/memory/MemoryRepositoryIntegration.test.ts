// Copyright (c) 2023. Heusala Group Oy <info@hg.fi>. All rights reserved.

import "../../../jest/matchers/index";
import { RepositoryUtils } from "../../RepositoryUtils";
import { LogLevel } from "../../../core/types/LogLevel";
import { CrudRepositoryImpl } from "../../types/CrudRepositoryImpl";
import { MemoryPersister } from "../../persisters/memory/MemoryPersister";
import { allRepositoryTests } from "../tests/allRepositoryTests";
import { setCrudRepositoryLogLevel } from "../../CrudRepository";
import { PersisterMetadataManagerImpl } from "../../PersisterMetadataManagerImpl";

describe('Repository integrations', () => {

    beforeAll(() => {
        RepositoryUtils.setLogLevel(LogLevel.NONE);
        setCrudRepositoryLogLevel(LogLevel.NONE);
        CrudRepositoryImpl.setLogLevel(LogLevel.NONE);
        PersisterMetadataManagerImpl.setLogLevel(LogLevel.NONE);
    });

    describe('Memory-based', () => {
        allRepositoryTests(() => new MemoryPersister());
    });

});
