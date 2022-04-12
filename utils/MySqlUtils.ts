// Copyright (c) 2022. Heusala Group Oy <info@heusalagroup.fi>. All rights reserved.

import { padStart } from "../../core/modules/lodash";

export class MySqlUtils {

    public static getDateTimeStringFromDate (
        time: Date
    ) : string {
        const year    = `${time.getUTCFullYear()}`;
        const month   = padStart(`${1 + time.getUTCMonth()}`, 2, '0');
        const date    = padStart(`${time.getUTCDate()}`, 2, '0');
        const hours   = padStart(`${time.getUTCHours()}`, 2, '0');
        const minutes = padStart(`${time.getUTCMinutes()}`, 2, '0');
        const seconds = padStart(`${time.getUTCSeconds()}`, 2, '0');
        return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
    }

    public static getDateTimeStringFromISOString (
        isoDate: string
    ) : string {
        return MySqlUtils.getDateTimeStringFromDate( new Date(isoDate) );
    }

}
