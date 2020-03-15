import { Pipe, PipeTransform } from '@angular/core';

import { UserCache } from '../../services/user-cache.service';

@Pipe({
  name: 'user'
})
export class UserPipe implements PipeTransform {
  constructor(private userCache: UserCache) {}

  transform(value: string) {
    return new Promise((resolve, reject) => {
      this.userCache.userWithId(value)
        .then((result) => resolve(result))
        .catch((error) => reject(error));
    });
  }
}
