// Copyright (c) 2023. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.
// Copyright (c) 2020-2023 Sendanor. All rights reserved.

import { Entity, EntityIdTypes } from "./Entity";
import { EntityMetadata, EntityField, KeyValuePairs } from "./types/EntityMetadata";
import { RepositoryError } from "./types/RepositoryError";
import { trim } from "../core/functions/trim";
import { isString } from "../core/types/String";
import { MySqlDateTime } from "./MySqlDateTime";
import { isReadonlyJsonAny, parseReadonlyJsonObject, ReadonlyJsonAny, ReadonlyJsonObject } from "../core/Json";
import { isNumber } from "../core/types/Number";
import { reduce } from "../core/functions/reduce";
import { LogService } from "../core/LogService";
import { CreateEntityLikeCallback } from "./types/EntityLike";
import { isFunction } from "../core/types/Function";
import { forEach } from "../core/functions/forEach";
import { keys } from "../core/functions/keys";
import { isUndefined } from "../core/types/undefined";
import { isNull } from "../core/types/Null";
import { isBoolean } from "../core/types/Boolean";
import { isNumberArray } from "../core/types/NumberArray";
import { isArray } from "../core/types/Array";
import { map } from "../core/functions/map";

const LOG = LogService.createLogger('EntityUtils');

export class EntityUtils {

    public static getColumnName (
        propertyName : string,
        fields       : EntityField[]
    ): string {
        const field = fields.find((x: EntityField) => x.propertyName === propertyName);
        if (field) {
            return field.columnName;
        }
        throw new RepositoryError(RepositoryError.Code.COLUMN_NAME_NOT_FOUND, `Column name not found for property: "${propertyName}"`);
    }

    public static getPropertyName (
        columnName : string,
        fields     : EntityField[]
    ): string {
        const field = fields.find((x: EntityField) => x.columnName === columnName);
        if (field) {
            return field.propertyName;
        }
        throw new RepositoryError(RepositoryError.Code.PROPERTY_NAME_NOT_FOUND, `Column not found: "${columnName}"`);
    }

    public static toJSON (
        entity: Entity,
        metadata: EntityMetadata
    ) : ReadonlyJsonObject {
        return reduce(
            metadata.fields,
            (prev: ReadonlyJsonObject, field: EntityField) : ReadonlyJsonObject => {
                const propertyName = field?.propertyName;
                if (!propertyName) throw new TypeError(`The field did not have propertyName defined`);
                const value : unknown = (entity as any)[propertyName];
                if (value === undefined) return prev;
                if (!isReadonlyJsonAny(value)) {
                    LOG.warn(`Could not convert property "${propertyName}" as JSON: Value not compatible for JSON:`, value);
                    return prev;
                }
                return {
                    ...prev,
                    [propertyName]: value
                };
            },
            {} as ReadonlyJsonObject
        );
    }

    public static clone (
        entity: Entity,
        metadata: EntityMetadata
    ) : Entity {
        const idPropertyName = metadata?.idPropertyName;
        if (!idPropertyName) throw new TypeError(`The entity metadata did not have id property name defined`);
        const createEntity : CreateEntityLikeCallback | undefined = metadata?.createEntity;
        if (!isFunction(createEntity)) {
            throw new TypeError(`The entity metadata did not have ability to create new entities. Did you forget '@table()' annotation?`);
        }
        const json = entity.toJSON();
        const clonedEntity = createEntity( json );

        // We need to copy all properties because entity constructor might not
        // initialize everything same way
        forEach(
            keys(json),
            (key: string) => {
                const entityValue = (entity as any)[key];
                if ( isString(entityValue)
                    || isNumber(entityValue)
                    || isBoolean(entityValue)
                    || isUndefined(entityValue)
                    || isNull(entityValue)
                ) {
                    (clonedEntity as any)[key] = entityValue;
                } else if (isArray(entityValue)) {
                    (clonedEntity as any)[key] = map(
                        entityValue,
                        (item) => {
                            if ( isString(item)
                                || isNumber(item)
                                || isBoolean(item)
                                || isUndefined(item)
                                || isNull(item)
                            ) {
                                return item;
                            } else {
                                LOG.debug(`entityValue = `, entityValue);
                                throw new TypeError(`Could not clone value: ${item}`);
                            }
                        }
                    );
                } else {
                    LOG.debug(`entityValue = `, entityValue);
                    throw new TypeError(`Could not clone value: ${entityValue}`);
                }
            }
        );

        return clonedEntity;
    }

    public static toEntity<T extends Entity, ID extends EntityIdTypes> (
        entity: KeyValuePairs,
        metadata: EntityMetadata
    ): T {
        return (
            metadata.fields
                .map((fld) => ({[fld.propertyName]: entity[fld.columnName]}))
                .reduce((prev, curr) => Object.assign(prev, curr)) as T
        );
    }

    public static getIdColumnName (metadata: EntityMetadata) : string {
        return EntityUtils.getColumnName(metadata.idPropertyName, metadata.fields);
    }

    public static getIdPropertyName (metadata: EntityMetadata) : string {
        return metadata.idPropertyName;
    }

    public static getId<T extends Entity, ID extends EntityIdTypes> (
        entity      : T,
        metadata    : EntityMetadata,
        tablePrefix : string = ''
    ): ID {

        const id = (entity as KeyValuePairs)[metadata.idPropertyName];

        if (id !== undefined) return id;

        throw new RepositoryError(RepositoryError.Code.ID_NOT_FOUND_FOR_TABLE, `Id property not found for table: "${tablePrefix}${metadata.tableName}"`);

    }

    public static isIdField (
        field: EntityField,
        metadata: EntityMetadata
    ) {
        return field.propertyName === metadata.idPropertyName;
    }

    public static parseStringArray (
        input: string | undefined,
        separator: string
    ) : string[] {
        return (input ?? '').split(separator).map(trim).filter((item: string) => !!item);
    }

    public static parseBoolean (input : any) : boolean {
        return input === true || input === 1;
    }

    public static parseString (input : any) : string {
        return isString(input) ? input : '';
    }

    public static parseNumber (input : any) : number | undefined {
        return isNumber(input) ? input : undefined;
    }

    public static parseJsonObject (input : any) : ReadonlyJsonObject | undefined {
        return parseReadonlyJsonObject(input);
    }

    public static parseIntegerAsString (input : string | number | undefined) : string | undefined {
        if ( (isString(input) && trim(input)) === '' || input === undefined ) return undefined;
        return `${input}`;
    }

    public static parseDateAsString (input : Date | string | undefined) : string | undefined {
        if ( (isString(input) && trim(input)) === '' || input === undefined ) return undefined;
        return `${input}`;
    }

    public static parseMySQLDateAsIsoString (value : any) : string | undefined {
        let parsed = MySqlDateTime.parse(EntityUtils.parseDateAsString(value));
        return parsed ? parsed.getISOString() : undefined;
    }

    public static parseDateAsIsoString (value : any) : string | undefined {
        let parsed = EntityUtils.parseDateAsString(value);
        return parsed ? parsed : undefined;
    }

    public static parseJson (value : any) : string | undefined {
        let parsed = MySqlDateTime.parse(EntityUtils.parseDateAsString(value));
        return parsed ? parsed.getISOString() : undefined;
    }

    public static parseIsoStringAsMySQLDateString (value : any) : string | undefined {
        let parsed = MySqlDateTime.parse(value);
        return parsed ? parsed.toString() : undefined;
    }

}
