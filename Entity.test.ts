// Copyright (c) 2023. Heusala Group Oy <info@hg.fi>. All rights reserved.

import { Column, Entity, Id, Table } from "./Entity";
import { EntityMetadata } from "./types/EntityMetadata";
import "../jest/matchers";

describe('Entity', () => {

    @Table('foos')
    class FooEntity extends Entity {

        constructor (dto ?: {fooName: string}) {
            super()
            this.fooName = dto?.fooName;
        }

        @Id()
        @Column('foo_id')
        public fooId ?: string;

        @Column('foo_name')
        public fooName ?: string;

        @Column('foo_number')
        public fooNumber ?: number;

        @Column('foo_boolean')
        public fooBoolean ?: boolean;

    }

    let entity : FooEntity;
    let metadata : EntityMetadata;

    beforeEach(() => {
        entity = new FooEntity();
        entity.fooId = '123';
        entity.fooName = 'Foo 123';
        entity.fooNumber = 123;
        entity.fooBoolean = true;
        metadata = entity.getMetadata();
    });

    describe('#getMetadata', () => {

        it('can get metadata', () => {
            const metadata = entity.getMetadata();
            expect(metadata?.tableName).toBe("foos");
            expect(metadata?.idPropertyName).toBe("fooId");
            expect(metadata?.createEntity).toBeFunction();
            expect(metadata?.fields).toStrictEqual(
                [
                   {
                       "columnName": "foo_id",
                       "propertyName": "fooId"
                   },
                   {
                       "columnName": "foo_name",
                       "propertyName": "fooName"
                   },
                   {
                       "columnName": "foo_number",
                       "propertyName": "fooNumber"
                   },
                   {
                       "columnName": "foo_boolean",
                       "propertyName": "fooBoolean"
                   }
               ]
            );
            expect(metadata?.relations).toStrictEqual([]);
        });

    });

    describe('#toJSON', () => {

        it('can get entity as json', () => {
            const json = entity.toJSON();
            expect(json).toStrictEqual(
                {
                    fooId: '123',
                    fooName: 'Foo 123',
                    fooNumber: 123,
                    fooBoolean: true
                }
            );
        });

    });

    describe('#clone', () => {

        it('can clone entity', () => {
            const clonedEntity : FooEntity = entity.clone();
            entity.fooBoolean = false;
            expect(clonedEntity?.fooBoolean).toBe(true);
        });

    });

});
