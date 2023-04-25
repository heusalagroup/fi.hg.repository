// Copyright (c) 2022-2023. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import { ReadonlyJsonObject } from "../../../core/Json";
import { map } from "../../../core/functions/map";
import { forEach } from "../../../core/functions/forEach";
import { filter } from "../../../core/functions/filter";
import { get } from "../../../core/functions/get";
import { explainNot, explainOk } from "../../../core/types/explain";

import { StoredRepositoryItem, StoredRepositoryItemExplainCallback, StoredRepositoryItemTestCallback } from "../../../core/simpleRepository/types/StoredRepositoryItem";
import { Repository as SimpleBaseRepository, REPOSITORY_NEW_IDENTIFIER } from "../../../core/simpleRepository/types/Repository";
import { createRepositoryEntry, RepositoryEntry } from "../../../core/simpleRepository/types/RepositoryEntry";
import { createRepositoryMember } from "../../../core/simpleRepository/types/RepositoryMember";

import { SimpleEntityRepository } from "./SimpleEntityRepository";
import { SimpleEntity } from "./SimpleEntity";
import { createNewSimpleDTO } from "./NewSimpleDTO";
import { RepositoryUtils } from "../../../core/simpleRepository/RepositoryUtils";
import { uniq } from "../../../core/functions/uniq";
import { concat } from "../../../core/functions/concat";

/**
 * This is an adapter between SimpleRepository framework and the Repository
 * framework.
 */
export class SimpleRepositoryAdapter<T extends StoredRepositoryItem> implements SimpleBaseRepository<T> {

    private readonly _repository : SimpleEntityRepository;
    private readonly _members  : readonly string[];
    private readonly _isT      : StoredRepositoryItemTestCallback;
    private readonly _explainT : StoredRepositoryItemExplainCallback;
    private readonly _tName    : string;

    public constructor (
        repository : SimpleEntityRepository,
        members    : readonly string[] = [],
        tName      : string | undefined = undefined,
        isT        : StoredRepositoryItemTestCallback,
        explainT   : StoredRepositoryItemExplainCallback | undefined = undefined
    ) {
        this._repository = repository;
        this._members  = members;
        this._isT      = isT;
        this._tName    = tName ?? 'T';
        this._explainT = explainT ?? ( (value: any) : string => isT(value) ? explainOk() : explainNot(this._tName) );
    }

    public async createItem (
        data: T,
        members?: readonly string[]
    ): Promise<RepositoryEntry<T>> {
        const newEntity = new SimpleEntity(
            createNewSimpleDTO(
                data as unknown as ReadonlyJsonObject,
                uniq(concat([], members ? members : [], this._members))
            )
        );
        const savedEntity = await this._repository.save(newEntity);
        return this._createRepositoryEntryFromEntity(savedEntity);
    }

    public async deleteAll (): Promise<RepositoryEntry<T>[]> {
        // FIXME: This call might not return all non-deleted entries
        const all = await this._repository.findAllByEntityDeleted(false);
        await this._repository.deleteAll();
        return this._createRepositoryEntryArrayFromEntityArray(all);
    }

    public async deleteById (id: string): Promise<RepositoryEntry<T>> {
        const entity : SimpleEntity | undefined = await this._repository.findById(id);
        if (!entity) throw new TypeError(`Could not find entity by id: ${id}`);
        entity.entityVersion = SimpleEntity.parseNextVersion(entity);
        entity.entityDeleted = true;
        const savedEntity = await this._repository.save(entity);
        return this._createRepositoryEntryFromEntity(savedEntity);
    }

    public async deleteByIdList (list: readonly string[]): Promise<RepositoryEntry<T>[]> {
        const entities = await this._repository.findAllById(list);
        forEach(
            entities,
            (item) => {
                item.entityVersion = SimpleEntity.parseNextVersion(item);
                item.entityDeleted = true;
            }
        );
        const savedEntities = await this._repository.saveAll(entities);
        return this._createRepositoryEntryArrayFromEntityArray(savedEntities);
    }

    public async deleteByList (list: RepositoryEntry<T>[]): Promise<RepositoryEntry<T>[]> {
        return await this.deleteByIdList( map(list, item => item.id) );
    }

    public async findById (
        id: string,
        includeMembers?: boolean
    ): Promise<RepositoryEntry<T> | undefined> {
        const entity : SimpleEntity | undefined = await this._repository.findById(id);
        if (!entity) return undefined;
        return this._createRepositoryEntryFromEntity(entity, includeMembers);
    }

    public async findByIdAndUpdate (id: string, item: T): Promise<RepositoryEntry<T>> {
        const entity : SimpleEntity | undefined = await this._repository.findById(id);
        if (!entity) throw new TypeError(`Could not find entity by id: ${id}`);
        entity.entityVersion = SimpleEntity.parseNextVersion(entity);
        entity.entityData = JSON.stringify(item);
        const savedEntity = await this._repository.save(entity);
        return this._createRepositoryEntryFromEntity(savedEntity);
    }

    /**
     *
     * @param propertyName
     * @param propertyValue
     * @fixme Current implementation is slow. Requires better implementation.
     */
    public async findByProperty (propertyName: string, propertyValue: any): Promise<RepositoryEntry<T> | undefined> {
        const result = await this.getAllByProperty(propertyName, propertyValue);
        const resultCount : number = result?.length ?? 0;
        if (resultCount === 0) return undefined;
        if (resultCount >= 2) throw new TypeError(`MemoryRepository.findByProperty: Multiple items found by property "${propertyName}" as: ${propertyValue}`);
        return result[0];
    }

    public async getAll (): Promise<RepositoryEntry<T>[]> {
        const entries = await this._repository.findAll();
        return this._createRepositoryEntryArrayFromEntityArray(entries);
    }

    /**
     *
     * @param propertyName
     * @param propertyValue
     * @FIXME: This is really slow and requires better implementation
     */
    public async getAllByProperty (propertyName: string, propertyValue: any): Promise<RepositoryEntry<T>[]> {
        const items : SimpleEntity[] = await this._repository.findAll();
        const filteredEntities = filter(
            items,
            (item: SimpleEntity) : boolean => get( SimpleEntity.parseData(item), propertyName) === propertyValue
        );
        return this._createRepositoryEntryArrayFromEntityArray(filteredEntities);
    }

    public async getSome (idList: readonly string[]): Promise<RepositoryEntry<T>[]> {
        const list : SimpleEntity[] = await this._repository.findAllById(idList);
        return this._createRepositoryEntryArrayFromEntityArray(list);
    }

    public async inviteToItem (id: string, members: readonly string[]): Promise<void> {
        const entity : SimpleEntity | undefined = await this._repository.findById(id);
        if (!entity) throw new TypeError(`Could not find entity by id: ${id}`);
        const prevMembers = SimpleEntity.parseMembers(entity) ?? [];
        const prevInvited = SimpleEntity.parseInvited(entity) ?? [];
        const newInvited = filter(
            uniq(
                concat(
                    [],
                    prevInvited,
                    members
                )
            ),
            (item : string) => !prevMembers.includes(item)
        );
        entity.entityVersion = SimpleEntity.parseNextVersion(entity);
        entity.entityInvited = SimpleEntity.prepareInvited(newInvited);
        const savedEntity = await this._repository.save(entity);
        await this._createRepositoryEntryFromEntity(savedEntity);
    }

    public isRepositoryEntryList (list: any): list is RepositoryEntry<T>[] {
        return RepositoryUtils.isRepositoryEntryList(list, this._isT);
    }

    /**
     *
     * @param id
     * @FIXME This will accept all received invites. Should we just accept our
     *        own? The implementation was copied from MemoryRepository.
     */
    public async subscribeToItem (id: string): Promise<void> {
        const entity : SimpleEntity | undefined = await this._repository.findById(id);
        if (!entity) throw new TypeError(`Could not find entity by id: ${id}`);
        const prevMembers = SimpleEntity.parseMembers(entity) ?? [];
        const prevInvited = SimpleEntity.parseInvited(entity) ?? [];
        const newMembers : string[] = concat(prevMembers, prevInvited);
        const newInvited : string[] = [];
        entity.entityVersion = SimpleEntity.parseNextVersion(entity);
        entity.entityMembers = SimpleEntity.prepareMembers(newMembers);
        entity.entityInvited = SimpleEntity.prepareInvited(newInvited);
        const savedEntity = await this._repository.save(entity);
        await this._createRepositoryEntryFromEntity(savedEntity);
    }

    public async update (id: string, data: T): Promise<RepositoryEntry<T>> {
        const entity : SimpleEntity | undefined = await this._repository.findById(id);
        if (!entity) throw new TypeError(`Could not find entity by id: ${id}`);
        entity.entityVersion = SimpleEntity.parseNextVersion(entity);
        entity.entityData = JSON.stringify(data);
        const savedEntity = await this._repository.save(entity);
        return this._createRepositoryEntryFromEntity(savedEntity);
    }

    public async updateOrCreateItem (item: T): Promise<RepositoryEntry<T>> {
        const id = item.id;
        const foundItem : RepositoryEntry<T> | undefined = id && id !== REPOSITORY_NEW_IDENTIFIER ? await this.findById(id) : undefined;
        if (foundItem) {
            return await this.update(foundItem.id, item);
        } else {
            return await this.createItem(item);
        }
    }

    /**
     *
     * @param id
     * @param includeMembers
     * @param timeout
     * @FIXME: Implement real long polling
     */
    public async waitById (id: string, includeMembers?: boolean, timeout?: number): Promise<RepositoryEntry<T> | undefined> {
        return new Promise((resolve, reject) => {
            setTimeout(
                () => {
                    resolve(this.findById(id, includeMembers));
                },
                timeout ?? 4000
            )
        });
    }

    private _createRepositoryEntryFromEntity (
        entity          : SimpleEntity,
        includeMembers ?: boolean | undefined
    ) : RepositoryEntry<T> {
        const dto = SimpleEntity.toDTO(entity);
        return createRepositoryEntry<T>(
            dto.data as unknown as T,
            dto.id,
            dto.version,
            dto.deleted,
            includeMembers && dto.members ? map(dto.members, (id: string) => createRepositoryMember(id)) : undefined
        );
    }

    private _createRepositoryEntryArrayFromEntityArray (list: readonly SimpleEntity[]) : RepositoryEntry<T>[] {
        return map(list, (item: SimpleEntity) => this._createRepositoryEntryFromEntity(item));
    }

}
