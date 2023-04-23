// Copyright (c) 2022-2023. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import { MySqlUtils } from "./utils/MySqlUtils";
import { JsonAny } from "../core/Json";
import { isIsoDateString, parseIsoDateString } from "../core/types/IsoDateString";
import { isValidDate } from "../core/types/Date";
import { isString } from "../core/types/String";
import { isNumber } from "../core/types/Number";

export class MySqlDateTime {

    private readonly _time : string;

    public constructor (time: string) {
        if (!isIsoDateString(time)) throw new TypeError(`Time was not valid ISO date string: '${time}'`);
        this._time = time;
    }

    public getISOString () : string {
        return this._time;
    }

    public toString (): string {
        return MySqlUtils.getDateTimeStringFromISOString(this._time);
    }

    public toJSON (): JsonAny {
        return this.getISOString();
    }

    public valueOf (): JsonAny {
        return this.getISOString();
    }

    public static create (time : string) : MySqlDateTime {
        return new MySqlDateTime(time);
    }

    public static parse (time : unknown) : MySqlDateTime | undefined {
        const value = parseIsoDateString(time);
        return value ? new MySqlDateTime(value) : undefined;
    }

}
