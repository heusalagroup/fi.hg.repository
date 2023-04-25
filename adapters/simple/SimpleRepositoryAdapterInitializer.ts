// Copyright (c) 2022-2023. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import { StoredRepositoryItem, StoredRepositoryItemExplainCallback, StoredRepositoryItemTestCallback } from "../../../core/simpleRepository/types/StoredRepositoryItem";
import { Repository } from "../../../core/simpleRepository/types/Repository";
import { SimpleRepositoryAdapter } from "./SimpleRepositoryAdapter";
import { RepositoryInitializer } from "../../../core/simpleRepository/types/RepositoryInitializer";
import { explainNot, explainOk } from "../../../core/types/explain";
import { SimpleEntityRepository } from "./SimpleEntityRepository";
import { SimpleEntity } from "./SimpleEntity";
import { NewSimpleDTO } from "./NewSimpleDTO";

export class SimpleRepositoryAdapterInitializer<
    T extends StoredRepositoryItem,
    SimpleEntityT extends SimpleEntity
> implements RepositoryInitializer<T> {

    private readonly _repository : SimpleEntityRepository<SimpleEntityT>;
    private readonly _members    : readonly string[] | undefined;
    private readonly _isT        : StoredRepositoryItemTestCallback;
    private readonly _explainT   : StoredRepositoryItemExplainCallback;
    private readonly _tName      : string;
    private readonly _tCreate    : (dto: NewSimpleDTO) => SimpleEntityT;

    public constructor (
        repository          : SimpleEntityRepository<SimpleEntityT>,
        tCreate             : (dto: NewSimpleDTO) => SimpleEntityT,
        isT                 : StoredRepositoryItemTestCallback,
        tName               : string,
        explainT            : StoredRepositoryItemExplainCallback,
        members             : readonly string[] | undefined
    ) {
        this._repository = repository;
        this._members    = members;
        this._isT        = isT;
        this._tName      = tName ?? 'T';
        this._tCreate    = tCreate;
        this._explainT   = explainT ?? ( (value: any) : string => isT(value) ? explainOk() : explainNot(this._tName) );
    }

    public async initializeRepository () : Promise<Repository<T>> {
        return new SimpleRepositoryAdapter<T, SimpleEntityT>(
            this._repository,
            this._tCreate,
            this._isT,
            this._tName,
            this._explainT,
            this._members
        );
    }

}
