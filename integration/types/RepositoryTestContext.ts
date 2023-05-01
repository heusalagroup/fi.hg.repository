// Copyright (c) 2023. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import { Persister } from "../../Persister";

export interface RepositoryTestContext {

    persister ?: Persister;

    getPersister() : Persister;

}

export function createRepositoryTestContext (
    persister ?: Persister | undefined
) : RepositoryTestContext {
    const context = {
        persister,
        getPersister (): Persister {
            let persisterOrNot = context.persister;
            if (!persisterOrNot) throw new TypeError(`The persister must be initialized first`);
            return persisterOrNot;
        }
    };
    return context;
}
