// Copyright (c) 2022. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import { MySqlUtils } from "./utils/MySqlUtils";
import { JsonAny } from "../core/Json";

export class MySqlDateTime {

    private readonly _time : string;

    public constructor (time: string) {
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

}
