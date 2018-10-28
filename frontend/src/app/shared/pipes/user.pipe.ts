import { Pipe, PipeTransform } from '@angular/core';

import { UserCache } from '../../services/user-cache.service';

@Pipe({
    name: 'user'
})
export class UserPipe implements PipeTransform {

    constructor(private userCache: UserCache) {}

    transform(value: string, userId: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.userCache.userWithId(userId).then((result) => {
                if (value === 'name') {
                    return resolve(result.name);
                } else if (value === 'username') {
                    return resolve(result.username);
                } else if (value === 'avatar') {
                    return resolve(result.avatar);
                }
            }).catch((error) => {
                reject(error);
            });
        });
    }

}
