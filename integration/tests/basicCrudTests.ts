// Copyright (c) 2023. Heusala Group Oy <info@hg.fi>. All rights reserved.

import "../../../jest/matchers/index";
import { Repository } from "../../types/Repository";
import { Column, Entity, Id, Table } from "../../Entity";
import { RepositoryTestContext } from "../types/RepositoryTestContext";
import { Persister } from "../../Persister";
import { createCrudRepositoryWithPersister } from "../../CrudRepository";
import { find } from "../../../core/functions/find";

export const basicCrudTests = (context : RepositoryTestContext) : void => {

    /**
     * Test entity for tests that require empty repository
     */
    @Table('foos')
    class FooEntity extends Entity {
        constructor (dto ?: {fooName: string}) {
            super()
            this.fooName = dto?.fooName;
        }

        @Id()
        @Column('foo_id', 'BIGINT')
        public fooId ?: string;

        @Column('foo_name')
        public fooName ?: string;

    }

    /**
     * Test entity for tests which require non-empty repository
     */
    @Table('bars')
    class BarEntity extends Entity {
        constructor (dto ?: {barName: string}) {
            super()
            this.barName = dto?.barName;
        }

        @Id()
        @Column('bar_id', 'BIGINT')
        public barId ?: string;

        @Column('bar_name')
        public barName ?: string;

    }

    interface FooRepository extends Repository<FooEntity, string> {

        findAllByFooName(name: string) : Promise<FooEntity[]>;
        findByFooName (name: string): Promise<FooEntity | undefined>;
        deleteAllByFooName (name: string): Promise<void>;
        existsByFooName (name : string): Promise<boolean>;
        countByFooName (name: string) : Promise<number>;

        findAllByFooId (ids: readonly string[]) : Promise<FooEntity[]>;
        findByFooId (id: string): Promise<FooEntity | undefined>;
        deleteAllByFooId (id: string): Promise<void>;
        existsByFooId (id : string): Promise<boolean>;
        countByFooId (id : string) : Promise<number>;

    }

    interface BarRepository extends Repository<BarEntity, string> {

        findAllByBarName(name: string) : Promise<BarEntity[]>;
        findByBarName (name: string): Promise<BarEntity | undefined>;
        deleteAllByBarName (name: string): Promise<void>;
        existsByBarName (name : string): Promise<boolean>;
        countByBarName (name : string) : Promise<number>;

        findAllByBarId(id: string) : Promise<BarEntity[]>;
        findByBarId (id: string): Promise<BarEntity | undefined>;
        deleteAllByBarId (id: string): Promise<void>;
        existsByBarId (id : string): Promise<boolean>;
        countByBarId (id : string) : Promise<number>;

    }

    let persister : Persister;
    let fooRepository : FooRepository;
    let barRepository : BarRepository;
    let barEntity1 : BarEntity;
    let barEntity2 : BarEntity;
    let barEntity3 : BarEntity;
    let barEntityId1 : string;
    let barEntityId2 : string;
    let barEntityId3 : string;

    let barEntityName1 : string = 'Bar 123';
    let barEntityName2 : string = 'Bar 456';
    let barEntityName3 : string = 'Bar 789';

    beforeEach( async () => {

        persister = context.getPersister();

        fooRepository = createCrudRepositoryWithPersister<FooEntity, string, FooRepository>(
            new FooEntity(),
            persister
        );
        barRepository = createCrudRepositoryWithPersister<BarEntity, string, BarRepository>(
            new BarEntity(),
            persister
        );

        await fooRepository.deleteAll();
        await barRepository.deleteAll();

        barEntity1 = await persister.insert(
            new BarEntity({barName: barEntityName1}),
            new BarEntity().getMetadata()
        );
        barEntityId1 = barEntity1?.barId as string;
        if (!barEntityId1) throw new TypeError('barEntity1 failed to initialize');

        barEntity2 = await persister.insert(
            new BarEntity({barName: barEntityName2}),
            new BarEntity().getMetadata()
        );
        barEntityId2 = barEntity2?.barId as string;
        if (!barEntityId2) throw new TypeError('barEntity2 failed to initialize');

        barEntity3 = await persister.insert(
            new BarEntity({barName: barEntityName3}),
            new BarEntity().getMetadata()
        );
        barEntityId3 = barEntity3?.barId as string;
        if (!barEntityId3) throw new TypeError('barEntity3 failed to initialize');

    });

    describe('#count', () => {

        it('can count entities', async () => {
            expect( await barRepository.count() ).toBe(3);
        });

    });

    describe('#delete', () => {

        it('can delete entity by entity object', async () => {
            expect( await barRepository.count() ).toBe(3);
            await barRepository.delete(barEntity2);
            expect( await barRepository.count() ).toBe(2);

            let entity : BarEntity | undefined = await barRepository.findByBarId(barEntityId2);
            expect(entity).not.toBeDefined();

        });

    });

    describe('#deleteById', () => {

        it('can delete entity by id', async () => {
            expect( await barRepository.count() ).toBe(3);
            await barRepository.deleteById(barEntityId2);
            expect( await barRepository.count() ).toBe(2);

            let entity : BarEntity | undefined = await barRepository.findByBarId(barEntityId2);
            expect(entity).not.toBeDefined();

        });

    });

    describe('#deleteAll', () => {

        it('can delete all entities', async () => {
            expect( await barRepository.count() ).toBe(3);
            await barRepository.deleteAll();
            expect( await barRepository.count() ).toBe(0);
        });

        it('can delete all entities with few ids', async () => {

            expect( await barRepository.count() ).toBe(3);
            await barRepository.deleteAll(
                [
                    barEntity2,
                    barEntity3
                ]
            );
            expect( await barRepository.count() ).toBe(1);

            let entity : BarEntity | undefined = await barRepository.findByBarId(barEntityId2);
            expect(entity).not.toBeDefined();

            let entity2 : BarEntity | undefined = await barRepository.findByBarId(barEntityId3);
            expect(entity2).not.toBeDefined();

        });

    });

    describe('#deleteAllById', () => {

        it('can delete all entities', async () => {
            expect( await barRepository.count() ).toBe(3);
            await barRepository.deleteAllById( [barEntityId2] );
            expect( await barRepository.count() ).toBe(2);
        });

        it('can delete all entities with few ids', async () => {
            expect( await barRepository.count() ).toBe(3);
            await barRepository.deleteAllById(
                [
                    barEntityId2,
                    barEntityId3
                ]
            );
            expect( await barRepository.count() ).toBe(1);

            let entity1 : BarEntity | undefined = await barRepository.findByBarId(barEntityId1);
            expect(entity1).toBeDefined();

            let entity2 : BarEntity | undefined = await barRepository.findByBarId(barEntityId2);
            expect(entity2).not.toBeDefined();

            let entity3 : BarEntity | undefined = await barRepository.findByBarId(barEntityId3);
            expect(entity3).not.toBeDefined();

        });

    });

    describe('#existsById', () => {

        it('can find if entity exists', async () => {
            expect( await barRepository.existsById( barEntityId2 ) ).toBe(true);
            await barRepository.deleteAllById( [barEntityId2] );
            expect( await barRepository.existsById( barEntityId2 ) ).toBe(false);
        });

    });

    describe('#findAll', () => {

        it('can find all entities', async () => {
            const items = await barRepository.findAll();
            expect(items).toBeArray();
            expect(items?.length).toBe(3);

            // Order may be different
            const item1 = find(items, (item) => item.barId === barEntityId1);
            const item2 = find(items, (item) => item.barId === barEntityId2);
            const item3 = find(items, (item) => item.barId === barEntityId3);

            expect(item1).toBeDefined();
            expect(item1?.barId).toBe(barEntityId1);
            expect(item1?.barName).toBe(barEntityName1);

            expect(item2).toBeDefined();
            expect(item2?.barId).toBe(barEntityId2);
            expect(item2?.barName).toBe(barEntityName2);

            expect(item3).toBeDefined();
            expect(item3?.barId).toBe(barEntityId3);
            expect(item3?.barName).toBe(barEntityName3);

        });

    });

    describe('#findAllById', () => {

        it('can find all entities by id', async () => {
            const items = await barRepository.findAllById([barEntityId2, barEntityId3]);
            expect(items).toBeArray();
            expect(items?.length).toBe(2);
            expect(items[0]?.barId).toBe(barEntityId2);
            expect(items[0]?.barName).toBe(barEntityName2);
            expect(items[1]?.barId).toBe(barEntityId3);
            expect(items[1]?.barName).toBe(barEntityName3);
        });

    });

    describe('#findById', () => {

        it('can find entity by id', async () => {
            const item = await barRepository.findById(barEntityId2);
            expect(item).toBeDefined();
            expect(item?.barId).toBe(barEntityId2);
            expect(item?.barName).toBe(barEntityName2);
        });

    });

    describe('#find', () => {

        it('can find entities by property', async () => {
            const items = await barRepository.find("barName", barEntityName2);
            expect(items).toBeArray();
            expect(items?.length).toBe(1);
            expect(items[0]?.barId).toBe(barEntityId2);
            expect(items[0]?.barName).toBe(barEntityName2);
        });

    });

    describe('#save', () => {

        it('can save fresh entity', async () => {

            expect( await fooRepository.count() ).toBe(0);

            const newEntity = new FooEntity({fooName: 'Hello world'});

            const savedItem = await fooRepository.save(newEntity);
            expect(savedItem).toBeDefined();
            expect(savedItem.fooId).toBeDefined();
            expect(savedItem.fooName).toBe('Hello world');

            const addedId : string = savedItem?.fooId as string;

            expect( await fooRepository.count() ).toBe(1);

            const foundItem = await fooRepository.findById(addedId);
            expect(foundItem).toBeDefined();
            expect(foundItem?.fooId).toBe(addedId);
            expect(foundItem?.fooName).toBe('Hello world');

        });

        it('can save older entity', async () => {

            expect( await barRepository.count() ).toBe(3);

            barEntity2.barName = 'Hello world';

            const savedItem = await barRepository.save(barEntity2);
            expect(savedItem).toBeDefined();
            expect(savedItem.barId).toBe(barEntityId2);
            expect(savedItem.barName).toBe('Hello world');

            expect( await barRepository.count() ).toBe(3);

            const foundItem = await barRepository.findById(barEntityId2);
            expect(foundItem).toBeDefined();
            expect(foundItem?.barId).toBe(barEntityId2);
            expect(foundItem?.barName).toBe('Hello world');

        });

    });

    describe('#saveAll', () => {

        it('can save fresh entities', async () => {

            expect( await fooRepository.count() ).toBe(0);

            const newEntity1 = new FooEntity({fooName: 'Hello world 1'});
            const newEntity2 = new FooEntity({fooName: 'Hello world 2'});

            const savedItems = await fooRepository.saveAll([newEntity1, newEntity2]);
            expect(savedItems).toBeArray();
            expect(savedItems?.length).toBe(2);

            expect(savedItems[0]?.fooId).toBeDefined();
            expect(savedItems[0]?.fooName).toBe('Hello world 1');

            expect(savedItems[1]?.fooId).toBeDefined();
            expect(savedItems[1]?.fooName).toBe('Hello world 2');

            const addedId1 : string = savedItems[0]?.fooId as string;
            const addedId2 : string = savedItems[1]?.fooId as string;

            expect( await fooRepository.count() ).toBe(2);

            const foundItem1 = await fooRepository.findById(addedId1);
            expect(foundItem1).toBeDefined();
            expect(foundItem1?.fooId).toBe(addedId1);
            expect(foundItem1?.fooName).toBe('Hello world 1');

            const foundItem2 = await fooRepository.findById(addedId2);
            expect(foundItem2).toBeDefined();
            expect(foundItem2?.fooId).toBe(addedId2);
            expect(foundItem2?.fooName).toBe('Hello world 2');

        });

        it('can save older entities', async () => {

            expect( await barRepository.count() ).toBe(3);

            barEntity2.barName = 'Hello world 1';
            barEntity3.barName = 'Hello world 2';

            const savedItems = await barRepository.saveAll([barEntity2, barEntity3]);
            expect(savedItems).toBeArray();
            expect(savedItems?.length).toBe(2);

            expect(savedItems[0].barId).toBe(barEntityId2);
            expect(savedItems[0].barName).toBe('Hello world 1');

            expect(savedItems[1].barId).toBe(barEntityId3);
            expect(savedItems[1].barName).toBe('Hello world 2');

            expect( await barRepository.count() ).toBe(3);

            const foundItem2 = await barRepository.findById(barEntityId2);
            expect(foundItem2).toBeDefined();
            expect(foundItem2?.barId).toBe(barEntityId2);
            expect(foundItem2?.barName).toBe('Hello world 1');

            const foundItem3 = await barRepository.findById(barEntityId3);
            expect(foundItem3).toBeDefined();
            expect(foundItem3?.barId).toBe(barEntityId3);
            expect(foundItem3?.barName).toBe('Hello world 2');

        });


    });

    describe('#findAllByBarName', () => {

        it('can fetch entities by barName property', async () => {
            const items = await barRepository.findAllByBarName(barEntityName2);
            expect(items).toBeArray();
            expect(items?.length).toBe(1);
            expect(items[0]?.barId).toBe(barEntityId2);
            expect(items[0]?.barName).toBe(barEntityName2);
        });

    });

    describe('#findByBarName', () => {

        it('can find entity by barName property', async () => {
            const entity : BarEntity | undefined = await barRepository.findByBarName(barEntityName2);
            expect(entity).toBeDefined();
            expect(entity?.barId).toBe(barEntityId2);
            expect(entity?.barName).toBe(barEntityName2);
        });

    });

    describe('#deleteAllByBarName', () => {

        it('can delete all properties by barName', async () => {
            await barRepository.deleteAllByBarName(barEntityName2);
            const entity : BarEntity | undefined = await barRepository.findByBarName(barEntityName2);
            expect(entity).not.toBeDefined();
        });

    });

    describe('#existsByBarName', () => {

        it('can find if entity exists by barName', async () => {
            expect( await barRepository.existsByBarName(barEntityName2) ).toBe(true);
            await barRepository.deleteAllByBarName(barEntityName2);
            expect( await barRepository.existsByBarName(barEntityName2) ).toBe(false);
        });

    });

    describe('#countByBarName', () => {

        it('can count entities by barName', async () => {
            expect( await barRepository.countByBarName(barEntityName2) ).toBe(1);
            await barRepository.deleteAllByBarName(barEntityName2);
            expect( await barRepository.countByBarName(barEntityName2) ).toBe(0);
        });

    });

    describe('#findAllByBarId', () => {

        it('can find all entities by barId', async () => {
            const items = await barRepository.findAllByBarId(barEntityId2);
            expect(items).toBeArray();
            expect(items?.length).toBe(1);
            expect(items[0]?.barId).toBe(barEntityId2);
            expect(items[0]?.barName).toBe(barEntityName2);
        });

    });

    describe('#findByBarId', () => {

        it('can find an entity by barId', async () => {
            const item = await barRepository.findByBarId(barEntityId2);
            expect(item?.barId).toBe(barEntityId2);
            expect(item?.barName).toBe(barEntityName2);
        });

    });

    describe('#deleteAllByBarId', () => {

        it('can delete all entities by barId', async () => {
            await barRepository.deleteAllByBarId(barEntityId2);
            const item = await barRepository.findByBarId(barEntityId2);
            expect(item).toBeUndefined();
        });

    });

    describe('#existsByBarId', () => {

        it('can find if entities exist by barId', async () => {
            expect( await barRepository.existsByBarId(barEntityId2) ).toBe(true);
            await barRepository.deleteAllByBarId(barEntityId2);
            expect( await barRepository.existsByBarId(barEntityId2) ).toBe(false);
        });

    });

    describe('#countByBarId', () => {

        it('can count entities by barId', async () => {
            expect( await barRepository.countByBarId(barEntityId2) ).toBe(1);
            await barRepository.deleteAllByBarId(barEntityId2);
            expect( await barRepository.countByBarId(barEntityId2) ).toBe(0);
        });

    });

};
