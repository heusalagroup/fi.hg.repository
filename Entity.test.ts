// Copyright (c) 2023. Heusala Group Oy <info@hg.fi>. All rights reserved.

import { Column, Entity, Id, Table } from "./Entity";
import { EntityField, EntityMetadata } from "./types/EntityMetadata";
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
        metadata = entity.getMetadata();
    });

    describe('Table', () => {

        it('can set tableName metadata', () => {
            expect(metadata.tableName).toBe('foos');
        });

        it('can set createEntity metadata', () => {
            expect(metadata.createEntity).toBeFunction();
        });

    });

    describe('Id', () => {

        it('can set idPropertyName metadata', () => {
            expect(metadata.idPropertyName).toBe('fooId');
        });

    });

    describe('Column', () => {

        it('can set fields metadata for string id field', () => {
            const expectedField : EntityField = {
                propertyName: "fooId",
                columnName: "foo_id"
            };
            expect(metadata.fields).toBeArray();
            expect(metadata.fields).toContainEqual(expectedField);
        });

        it('can set fields metadata for string property', () => {
            const expectedField : EntityField = {
                propertyName: "fooName",
                columnName: "foo_name"
            };
            expect(metadata.fields).toBeArray();
            expect(metadata.fields).toContainEqual(expectedField);
        });

        it('can set fields metadata for number property', () => {
            const expectedField : EntityField = {
                propertyName: "fooNumber",
                columnName: "foo_number"
            };
            expect(metadata.fields).toBeArray();
            expect(metadata.fields).toContainEqual(expectedField);
        });

        it('can set fields metadata for boolean property', () => {
            const expectedField : EntityField = {
                propertyName: "fooBoolean",
                columnName: "foo_boolean"
            };
            expect(metadata.fields).toBeArray();
            expect(metadata.fields).toContainEqual(expectedField);
        });

    });

});
