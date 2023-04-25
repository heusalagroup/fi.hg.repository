// Copyright (c) 2022-2023. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import { StoredRepositoryItem, StoredRepositoryItemExplainCallback, StoredRepositoryItemTestCallback } from "../../../core/simpleRepository/types/StoredRepositoryItem";
import { Repository } from "../../../core/simpleRepository/types/Repository";
import { SimpleRepositoryAdapter } from "./SimpleRepositoryAdapter";
import { RepositoryInitializer } from "../../../core/simpleRepository/types/RepositoryInitializer";
import { explainNot, explainOk } from "../../../core/types/explain";
import { SimpleEntityRepository } from "./SimpleEntityRepository";

export class SimpleRepositoryAdapterInitializer<T extends StoredRepositoryItem> implements RepositoryInitializer<T> {

    private readonly _repository : SimpleEntityRepository;
    private readonly _members    : readonly string[] | undefined;
    private readonly _isT        : StoredRepositoryItemTestCallback;
    private readonly _explainT   : StoredRepositoryItemExplainCallback;
    private readonly _tName      : string;

    public constructor (
        repository          : SimpleEntityRepository,
        isT                 : StoredRepositoryItemTestCallback,
        tName               : string                              | undefined = undefined,
        explainT            : StoredRepositoryItemExplainCallback | undefined = undefined,
        members             : readonly string[] | undefined
    ) {
        this._repository = repository;
        this._members    = members;
        this._isT        = isT;
        this._tName      = tName ?? 'T';
        this._explainT   = explainT ?? ( (value: any) : string => isT(value) ? explainOk() : explainNot(this._tName) );
    }

    public async initializeRepository () : Promise<Repository<T>> {
        return new SimpleRepositoryAdapter<T>(
            this._repository,
            this._members,
            this._tName,
            this._isT,
            this._explainT
        );
    }

}
