// Copyright (c) 2023. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import { Persister } from "../../Persister";
import { Entity, EntityIdTypes } from "../../Entity";
import { EntityMetadata } from "../../types/EntityMetadata";
import { first } from "../../../core/functions/first";
import { isArray } from "../../../core/types/Array";
import { has } from "../../../core/functions/has";
import { filter } from "../../../core/functions/filter";
import { some } from "../../../core/functions/some";
import { map } from "../../../core/functions/map";
import { find } from "../../../core/functions/find";
import { forEach } from "../../../core/functions/forEach";

export interface MemoryItem {
    readonly id    : string | number;
    value : Entity;
}

export interface MemoryTable {

    items : MemoryItem[];

}

export enum MemoryIdType {
    STRING = "STRING",
    NUMBER = "NUMBER",
}

/**
 * Internal ID sequencer for memory items
 */
let ID_SEQUENCER = 0;

export class MemoryPersister implements Persister {

    private readonly _idType : MemoryIdType;
    private readonly _data : { [tableName: string] : MemoryTable };

    /**
     *
     * @param idType
     * @FIXME: The `idType` should probably be detected from metadata and changable through annotations
     */
    constructor (
        idType ?: MemoryIdType
    ) {
        this._data = {};
        this._idType = idType ?? MemoryIdType.STRING;
    }

    public async count<T extends Entity, ID extends EntityIdTypes> (
        metadata: EntityMetadata
    ): Promise<number> {
        const tableName = metadata.tableName;
        if(!has(this._data, tableName)) return 0;
        return this._data[tableName].items.length;
    }

    public async countByProperty<T extends Entity, ID extends EntityIdTypes> (
        property: string,
        value: any,
        metadata: EntityMetadata
    ): Promise<number> {
        const tableName = metadata.tableName;
        if(!has(this._data, tableName)) return 0;
        return filter(
            this._data[tableName].items,
            (item: MemoryItem) : boolean => has(item.value, property) && value === (item.value as any)[property]
        ).length;
    }

    public async deleteAll<T extends Entity, ID extends EntityIdTypes> (
        metadata: EntityMetadata
    ): Promise<void> {
        const tableName = metadata.tableName;
        if (!has(this._data, tableName)) return;
        delete this._data[tableName];
    }

    public async deleteAllById<T extends Entity, ID extends EntityIdTypes> (
        ids: ID[],
        metadata: EntityMetadata
    ): Promise<void> {
        const tableName = metadata.tableName;
        if(!has(this._data, tableName)) return;
        this._data[tableName].items = filter(
            this._data[tableName].items,
            (item: MemoryItem) : boolean => !ids.includes(item.id as unknown as ID)
        );
    }

    public async deleteAllByProperty<T extends Entity, ID extends EntityIdTypes> (
        property: string,
        value: any,
        metadata: EntityMetadata
    ): Promise<void> {
        const tableName = metadata.tableName;
        if(!has(this._data, tableName)) return;
        this._data[tableName].items = filter(
            this._data[tableName].items,
            (item: MemoryItem) : boolean => has(item.value, property) ? (item.value as any)[property] !== value : true
        );
    }

    public async deleteById<T extends Entity, ID extends EntityIdTypes> (
        id: ID,
        metadata: EntityMetadata
    ): Promise<void> {
        return await this.deleteAllById([id], metadata);
    }

    public async existsByProperty<T extends Entity, ID extends EntityIdTypes> (
        property: string,
        value: any,
        metadata: EntityMetadata
    ): Promise<boolean> {
        const tableName = metadata.tableName;
        if(!has(this._data, tableName)) return false;
        return some(
            this._data[tableName].items,
            (item: MemoryItem) : boolean => has(item.value, property) ? (item.value as any)[property] === value : false
        );
    }

    public async findAll<T extends Entity, ID extends EntityIdTypes> (
        metadata: EntityMetadata
    ): Promise<T[]> {
        const tableName = metadata.tableName;
        if(!has(this._data, tableName)) return [];
        return map(
            this._data[tableName].items,
            (item: MemoryItem) : T => (item.value.clone() as T)
        );
    }

    public async findAllById<T extends Entity, ID extends EntityIdTypes> (
        ids: ID[],
        metadata: EntityMetadata
    ): Promise<T[]> {
        const tableName = metadata.tableName;
        if(!has(this._data, tableName)) return [];
        return map(
            filter(
                this._data[tableName].items,
                (item: MemoryItem) : boolean => ids.includes( item.id as unknown as ID )
            ),
            (item: MemoryItem) : T => (item.value.clone() as T)
        );
    }

    public async findAllByProperty<T extends Entity, ID extends EntityIdTypes> (
        property: string,
        value: any,
        metadata: EntityMetadata
    ): Promise<T[]> {
        const tableName = metadata.tableName;
        if(!has(this._data, tableName)) return [];
        return map(
            filter(
                this._data[tableName].items,
                (item: MemoryItem) : boolean => has(item.value, property) ? (item.value as any)[property] === value : false
            ),
            (item: MemoryItem) : T => (item.value.clone() as T)
        );
    }

    public async findById<T extends Entity, ID extends EntityIdTypes> (
        id: ID,
        metadata: EntityMetadata
    ): Promise<T | undefined> {
        const tableName = metadata.tableName;
        if(!has(this._data, tableName)) return undefined;
        const item = find(
            this._data[tableName].items,
            (item: MemoryItem) : boolean => item.id === id
        );
        if (!item) return undefined;
        return item.value.clone() as T;
    }

    public async findByProperty<T extends Entity, ID extends EntityIdTypes> (
        property: string,
        value: any,
        metadata: EntityMetadata
    ): Promise<T | undefined> {
        const tableName = metadata.tableName;
        if(!has(this._data, tableName)) return undefined;
        const item = find(
            this._data[tableName].items,
            (item: MemoryItem) : boolean => has(item.value, property) ? (item.value as any)[property] === value : false
        );
        if (!item) return undefined;
        return item.value.clone() as T;
    }

    public async insert<T extends Entity, ID extends EntityIdTypes> (
        entity: T[] | T,
        metadata: EntityMetadata
    ): Promise<T> {

        const list = map(
            isArray(entity) ? entity : [entity],
            (item : T) : T => item.clone() as T
        );

        const tableName = metadata.tableName;
        const idPropertyName = metadata.idPropertyName;
        if(!has(this._data, tableName)) {
            this._data[tableName] = {
                items: []
            };
        }
        const allIds = map(this._data[tableName].items, (item) => item.id);

        const newItems : MemoryItem[] = map(
            list,
            (item: T) : MemoryItem => {
                if ( !( has(item, idPropertyName) && (item as any)[idPropertyName]) ) {
                    const newId : number = ++ID_SEQUENCER;
                    (item as any)[idPropertyName] = this._idType === MemoryIdType.STRING ? `${newId}` : newId;
                }
                const id = (item as any)[idPropertyName];
                if (!id) {
                    throw new TypeError(`Entity cannot be saved with id as "${id}"`);
                }
                if (allIds.includes(id)) {
                    throw new TypeError(`Entity already stored with id "${id}"`);
                }
                allIds.push(id);
                return {
                    id: id,
                    value: item
                };
            }
        );

        // Let's call this outside above loop for better error management
        forEach(
            newItems,
            (item) => {
                this._data[tableName].items.push(item);
            }
        );

        // FIXME: We should return more than one if there were more than one
        const firstItem = first(newItems);
        if (!firstItem) throw new TypeError(`Could not add items`);
        return firstItem.value.clone() as T;
    }

    public async update<T extends Entity, ID extends EntityIdTypes> (
        entity: T,
        metadata: EntityMetadata
    ): Promise<T> {
        entity = entity.clone() as T;
        const tableName = metadata.tableName;
        if (!has(this._data, tableName)) {
            this._data[tableName] = {
                items: []
            };
        }
        const idPropertyName = metadata.idPropertyName;
        if (!(idPropertyName && has(entity, idPropertyName))) throw new TypeError(`The entity did not have a property for id: "${idPropertyName}"`);
        const id : ID = (entity as any)[idPropertyName];
        if (!id) throw new TypeError(`The entity did not have a valid entity id at property: "${idPropertyName}": ${id}`);
        const savedItem : MemoryItem | undefined = find(
            this._data[tableName].items,
            (item: MemoryItem) : boolean => item.id === id
        );
        if (savedItem) {
            savedItem.value = entity;
        } else {
            this._data[tableName].items.push(
                {
                    id,
                    value: entity
                }
            );
        }
        return entity.clone() as T;
    }

}
