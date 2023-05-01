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

export const TEST_SCOPES             : readonly string[] = (parseNonEmptyString(process?.env?.TEST_SCOPES) ?? '').split(/[,| :;+]+/);
export const MYSQL_HOSTNAME          : string   = parseNonEmptyString(process?.env?.TEST_MYSQL_HOSTNAME)          ?? 'localhost';
export const MYSQL_USERNAME          : string   = parseNonEmptyString(process?.env?.TEST_MYSQL_USERNAME)          ?? 'hg';
export const MYSQL_PASSWORD          : string   = parseNonEmptyString(process?.env?.TEST_MYSQL_PASSWORD)          ?? '';
export const MYSQL_DATABASE          : string   = parseNonEmptyString(process?.env?.TEST_MYSQL_DATABASE)          ?? 'hg';
export const MYSQL_TABLE_PREFIX      : string   = parseNonEmptyString(process?.env?.TEST_MYSQL_TABLE_PREFIX)      ?? '';
export const MYSQL_CHARSET           : string   = parseNonEmptyString(process?.env?.TEST_MYSQL_CHARSET )          ?? 'LATIN1_SWEDISH_CI';

export const INTEGRATION_TESTS_ENABLED : boolean = TEST_SCOPES.includes('integration') && !!MYSQL_PASSWORD;

(INTEGRATION_TESTS_ENABLED ? describe : describe.skip)('Repository integrations', () => {

    beforeAll(() => {
        RepositoryUtils.setLogLevel(LogLevel.NONE);
        setCrudRepositoryLogLevel(LogLevel.NONE);
        CrudRepositoryImpl.setLogLevel(LogLevel.NONE);
        PersisterMetadataManagerImpl.setLogLevel(LogLevel.NONE);
        MySqlPersister.setLogLevel(LogLevel.NONE);
    });

    describe('MySQL', () => {
        allRepositoryTests(
            () => new MySqlPersister(
                MYSQL_HOSTNAME,
                MYSQL_USERNAME,
                MYSQL_PASSWORD,
                MYSQL_DATABASE,
                MYSQL_TABLE_PREFIX,
                100,
                0,
                60*60*1000,
                60*60*1000,
                60*60*1000,
                60*60*1000,
                true,
                MYSQL_CHARSET
            ),
            true,
            false
        );
    });

});
