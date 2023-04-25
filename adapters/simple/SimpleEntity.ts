// Copyright (c) 2020-2023. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import { LogService } from "../../../core/LogService";
import { Column, Entity, Id } from "../../Entity";
import { NewSimpleDTO } from "./NewSimpleDTO";
import { EntityUtils } from "../../EntityUtils";
import { createSimpleDTO, isSimpleDTO, SimpleDTO } from "./SimpleDTO";
import { ReadonlyJsonObject } from "../../../core/Json";
import { join } from "../../../core/functions/join";
import { REPOSITORY_NEW_IDENTIFIER } from "../../../core/simpleRepository/types/Repository";

const LOG = LogService.createLogger('SimpleEntity');

export class SimpleEntity extends Entity {

    // The constructor

    public constructor ();
    public constructor (dto : NewSimpleDTO);

    public constructor (dto ?: NewSimpleDTO) {
        super();
        this.entityId = REPOSITORY_NEW_IDENTIFIER;
        this.entityUpdated = undefined;
        this.entityCreated = undefined;
        this.entityData = dto ? JSON.stringify(dto?.data) : '{}';
        this.entityMembers = dto ? SimpleEntity.prepareMembers(dto?.members) : '[]';
        this.entityInvited = '[]';
        this.entityVersion = 0;
        this.entityDeleted = false;
    }

    @Id()
    @Column("id")
    public entityId?: string;

    @Column("updated")
    public entityUpdated?: string;

    @Column("created")
    public entityCreated?: string;

    @Column("data")
    public entityData?: string;

    @Column("members")
    public entityMembers?: string;

    @Column("invited")
    public entityInvited?: string;

    @Column("version")
    public entityVersion?: number;

    @Column("deleted")
    public entityDeleted?: boolean;

    public static parseId (entity: SimpleEntity) : string {
        return EntityUtils.parseIntegerAsString(entity.entityId) ?? '';
    }

    public static parseUpdated (entity: SimpleEntity) : string {
        return EntityUtils.parseMySQLDateAsIsoString(entity.entityUpdated) ?? '';
    }

    public static parseCreated (entity: SimpleEntity) : string {
        return EntityUtils.parseMySQLDateAsIsoString(entity.entityCreated) ?? '';
    }

    public static parseData (entity: SimpleEntity) : ReadonlyJsonObject {
        return EntityUtils.parseJsonObject(entity.entityData) ?? {};
    }

    public static parseMembers (entity: SimpleEntity) : readonly string[] {
        return EntityUtils.parseStringArray(entity.entityMembers, ' ');
    }

    public static parseInvited (entity: SimpleEntity) : readonly string[] {
        return EntityUtils.parseStringArray(entity.entityInvited, ' ');
    }

    public static prepareMembers (value : readonly string[]) : string {
        return join(value, ' ');
    }

    public static prepareInvited (value : readonly string[]) : string {
        return join(value, ' ');
    }

    public static parseVersion (entity: SimpleEntity) : number {
        return EntityUtils.parseNumber(entity.entityVersion) ?? 0;
    }

    public static parseDeleted (entity: SimpleEntity) : boolean {
        return EntityUtils.parseBoolean(entity.entityDeleted) ?? false;
    }

    public static parseNextVersion (entity: SimpleEntity) : number {
        return this.parseVersion(entity) + 1;
    }

    public static toDTO (entity: SimpleEntity) : SimpleDTO {
        const dto : SimpleDTO = createSimpleDTO(
            this.parseId(entity),
            this.parseUpdated(entity),
            this.parseCreated(entity),
            this.parseData(entity),
            this.parseMembers(entity),
            this.parseInvited(entity),
            this.parseVersion(entity),
            this.parseDeleted(entity)
        );
        // Redundant fail safe
        if (!isSimpleDTO(dto)) {
            LOG.debug(`toDTO: dto / entity = `, dto, entity);
            throw new TypeError(`Failed to create valid SimpleDTO`);
        }
        return dto;
    }

}

