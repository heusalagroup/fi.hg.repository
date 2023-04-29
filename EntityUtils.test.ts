// Copyright (c) 2023. Heusala Group Oy <info@hg.fi>. All rights reserved.

import { EntityUtils } from "./EntityUtils";
import { Column, Entity, Id, Table } from "./Entity";
import { createEntityField, createEntityMetadata, EntityMetadata } from "./types/EntityMetadata";
import "../jest/matchers";

describe('EntityUtils', () => {

    @Table('foos')
    class FooEntity extends Entity {
        constructor (dto ?: {fooName: string}) {
            super()
            this.fooId = undefined;
            this.fooName = dto?.fooName;
        }

        @Id()
        @Column('foo_id')
        public fooId ?: string;

        @Column('foo_name')
        public fooName ?: string;

    }

    describe('#toJSON', () => {

        let fooMetadata : EntityMetadata;
        let fooEntity : FooEntity;
        let fooEntityWithId : FooEntity;

        beforeEach(() => {

            fooEntity = new FooEntity({fooName: 'Hello world'});

            fooEntityWithId = new FooEntity({fooName: 'Hello world'});
            fooEntityWithId.fooId = '123';

            fooMetadata = createEntityMetadata(
                'foos',
                'fooId',
                [
                    createEntityField('fooId', 'foo_id'),
                    createEntityField('fooName', 'foo_name')
                ],
                (dto?: any) => new FooEntity(dto)
            );

        });

        it('can turn fresh entity as JSON object', () => {
            const fooJson = EntityUtils.toJSON(fooEntity, fooMetadata);
            expect( fooJson ).toBeRegularObject();
            expect( fooJson?.fooId ).not.toBeDefined();
            expect( fooJson?.fooName ).toBe('Hello world');
        });

        it('can turn older entity with id as JSON object', () => {
            const fooJson = EntityUtils.toJSON(fooEntityWithId, fooMetadata);
            expect( fooJson ).toBeRegularObject();
            expect( fooJson?.fooId ).toBe('123');
            expect( fooJson?.fooName ).toBe('Hello world');
        });

    });

    describe('#clone', () => {

        let fooMetadata : EntityMetadata;
        let fooEntity : FooEntity;
        let fooEntityWithId : FooEntity;

        beforeEach(() => {

            fooEntity = new FooEntity({fooName: 'Hello world'});

            fooEntityWithId = new FooEntity({fooName: 'Hello world'});
            fooEntityWithId.fooId = '123';

            fooMetadata = createEntityMetadata(
                'foos',
                'fooId',
                [
                    createEntityField('fooId', 'foo_id'),
                    createEntityField('fooName', 'foo_name')
                ],
                (dto?: any) => new FooEntity(dto)
            );

        });

        it('can clone fresh entity without id and changes do not propagate to the parent', () => {
            const clonedEntity : FooEntity = EntityUtils.clone(fooEntity, fooMetadata);
            expect( clonedEntity?.fooId ).not.toBeDefined();
            expect( clonedEntity?.fooName ).toBe('Hello world');
            expect( fooEntity?.fooId ).not.toBeDefined();
            expect( fooEntity?.fooName ).toBe('Hello world');
            clonedEntity.fooName = '123';
            expect( clonedEntity?.fooId ).not.toBeDefined();
            expect( clonedEntity?.fooName ).toBe('123');
            expect( fooEntity?.fooId ).not.toBeDefined();
            expect( fooEntity?.fooName ).toBe('Hello world');
        });

        it('can clone fresh entity without id and changes in the parent do not propagate to the child', () => {
            const clonedEntity : FooEntity = EntityUtils.clone(fooEntity, fooMetadata);
            expect( clonedEntity?.fooId ).not.toBeDefined();
            expect( clonedEntity?.fooName ).toBe('Hello world');
            expect( fooEntity?.fooId ).not.toBeDefined();
            expect( fooEntity?.fooName ).toBe('Hello world');
            fooEntity.fooName = '123';
            expect( clonedEntity?.fooId ).not.toBeDefined();
            expect( clonedEntity?.fooName ).toBe('Hello world');
            expect( fooEntity?.fooId ).not.toBeDefined();
            expect( fooEntity?.fooName ).toBe('123');
        });

        it('can clone older entity with ID and changes do not propagate to the parent', () => {
            const clonedEntity : FooEntity = EntityUtils.clone(fooEntityWithId, fooMetadata);
            expect( clonedEntity?.fooId ).toBe('123');
            expect( clonedEntity?.fooName ).toBe('Hello world');
            expect( fooEntityWithId?.fooId ).toBe('123');
            expect( fooEntityWithId?.fooName ).toBe('Hello world');
            clonedEntity.fooName = '123';
            expect( clonedEntity?.fooId ).toBe('123');
            expect( clonedEntity?.fooName ).toBe('123');
            expect( fooEntityWithId?.fooId ).toBe('123');
            expect( fooEntityWithId?.fooName ).toBe('Hello world');
        });

        it('can clone older entity with ID and changes in the parent do not propagate to the child', () => {
            const clonedEntity : FooEntity = EntityUtils.clone(fooEntityWithId, fooMetadata);
            expect( clonedEntity?.fooId ).toBe('123');
            expect( clonedEntity?.fooName ).toBe('Hello world');
            expect( fooEntityWithId?.fooId ).toBe('123');
            expect( fooEntityWithId?.fooName ).toBe('Hello world');
            fooEntityWithId.fooName = '123';
            expect( clonedEntity?.fooId ).toBe('123');
            expect( clonedEntity?.fooName ).toBe('Hello world');
            expect( fooEntityWithId?.fooId ).toBe('123');
            expect( fooEntityWithId?.fooName ).toBe('123');
        });

    });

});
