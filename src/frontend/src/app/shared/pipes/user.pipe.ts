import { Pipe, PipeTransform } from '@angular/core';

import { APIClient } from '../../services/api-client.service';

@Pipe({
  name: 'user'
})
export class UserPipe implements PipeTransform {
  constructor(private apiClient: APIClient) {}

  transform(value: string) {
    return this.apiClient.getUser(value);
  }
}
