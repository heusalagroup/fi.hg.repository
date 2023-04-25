// Copyright (c) 2020-2023. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import { isRegularObject } from "../../../core/types/RegularObject";
import { hasNoOtherKeysInDevelopment } from "../../../core/types/OtherKeys";
import { isReadonlyJsonObject, ReadonlyJsonObject } from "../../../core/Json";
import { isStringArray } from "../../../core/types/StringArray";

export interface NewSimpleDTO {
    readonly data : ReadonlyJsonObject;
    readonly members : readonly string[];
}

export function createNewSimpleDTO (
    data : ReadonlyJsonObject,
    members ?: readonly string[]
) : NewSimpleDTO {
    return {
        data,
        members: members ?? []
    };
}


export function isNewSimpleDTO (value: any): value is NewSimpleDTO {
    return (
        isRegularObject(value)
        && hasNoOtherKeysInDevelopment(value, [
            'data',
            'members'
        ])
        && isReadonlyJsonObject(value?.data)
        && isStringArray(value?.members)
    );
}

export function stringifyNewSimpleDTO (value: NewSimpleDTO): string {
    if ( !isNewSimpleDTO(value) ) throw new TypeError(`Not NewSimpleDTO: ${value}`);
    return `NewSimpleDTO(${value})`;
}

export function parseNewSimpleDTO (value: any): NewSimpleDTO | undefined {
    if ( isNewSimpleDTO(value) ) return value;
    return undefined;
}
