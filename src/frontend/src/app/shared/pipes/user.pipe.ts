import {Pipe, PipeTransform} from '@angular/core';

import {APIClient} from '../../services/api-client.service';

@Pipe({
  name: 'user',
  standalone: true
})
export class UserPipe implements PipeTransform {
  constructor(private apiClient: APIClient) {}

  transform(value: number) {
    return this.apiClient.getUser(value);
  }
}
