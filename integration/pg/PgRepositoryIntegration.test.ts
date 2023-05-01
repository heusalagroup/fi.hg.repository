// Copyright (c) 2023. Heusala Group Oy <info@hg.fi>. All rights reserved.

import "../../../jest/matchers/index";
import { RepositoryUtils } from "../../RepositoryUtils";
import { LogLevel } from "../../../core/types/LogLevel";
import { CrudRepositoryImpl } from "../../types/CrudRepositoryImpl";
import { allRepositoryTests } from "../tests/allRepositoryTests";
import { setCrudRepositoryLogLevel } from "../../CrudRepository";
import { PersisterMetadataManagerImpl } from "../../PersisterMetadataManagerImpl";
import { MySqlPersister } from "../../persisters/mysql/MySqlPersister";
import { parseNonEmptyString } from "../../../core/types/String";
import { PgPersister } from "../../persisters/pg/PgPersister";

export const TEST_SCOPES             : readonly string[] = (parseNonEmptyString(process?.env?.TEST_SCOPES) ?? '').split(/[,| :;+]+/);
export const POSTGRES_HOSTNAME          : string   = parseNonEmptyString(process?.env?.TEST_POSTGRES_HOSTNAME)          ?? 'localhost';
export const POSTGRES_USERNAME          : string   = parseNonEmptyString(process?.env?.TEST_POSTGRES_USERNAME)          ?? 'hg';
export const POSTGRES_PASSWORD          : string   = parseNonEmptyString(process?.env?.TEST_POSTGRES_PASSWORD)          ?? '';
export const POSTGRES_DATABASE          : string   = parseNonEmptyString(process?.env?.TEST_POSTGRES_DATABASE)          ?? 'hg';
export const POSTGRES_TABLE_PREFIX      : string   = parseNonEmptyString(process?.env?.TEST_POSTGRES_TABLE_PREFIX)      ?? '';
export const POSTGRES_CHARSET           : string   = parseNonEmptyString(process?.env?.TEST_POSTGRES_CHARSET )          ?? '';
export const POSTGRES_SSL               : boolean | undefined   = ['1', 'TRUE', 'ENABLED', 'ON'].includes((parseNonEmptyString(process?.env?.TEST_POSTGRES_SSL ) ?? '').toUpperCase());

export const INTEGRATION_TESTS_ENABLED : boolean = TEST_SCOPES.includes('integration') && !!POSTGRES_PASSWORD;

(INTEGRATION_TESTS_ENABLED ? describe : describe.skip)('Repository integrations', () => {

    beforeAll(() => {
        RepositoryUtils.setLogLevel(LogLevel.NONE);
        setCrudRepositoryLogLevel(LogLevel.NONE);
        CrudRepositoryImpl.setLogLevel(LogLevel.NONE);
        PersisterMetadataManagerImpl.setLogLevel(LogLevel.NONE);
        PgPersister.setLogLevel(LogLevel.NONE);
    });

    describe('PostgreSQL', () => {
        allRepositoryTests(
            () => new PgPersister(
                POSTGRES_HOSTNAME,
                POSTGRES_USERNAME,
                POSTGRES_PASSWORD,
                POSTGRES_DATABASE,
                POSTGRES_SSL
            ),
            true,
            false
        );
    });

});
