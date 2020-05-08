import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Image } from '../../models/image.model';
import { APIClient } from '../../services/api-client.service';
import { PaginationService } from '../../services/pagination.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  providers: [PaginationService]
})
export class ProfileComponent {
  user: User;

  constructor(private apiClient: APIClient,
              private pagination: PaginationService<Image>,
              private route: ActivatedRoute) {
    this.route.params.subscribe((params) => {
      const id = params.id;
      if (!this.user || id !== this.user.id) {
        this.loadUser(id);
      }
    });
  }

  loadUser(userId: number) {
    this.apiClient.getUser(userId, true).subscribe(
      (data) => {
        this.user = data;
        this.pagination.reset();
        this.loadNextPage();
      },
      (error) => console.error(`Loading user failed: ${error.message}`)
    );
  }

  loadNextPage() {
    this.apiClient.getImages(this.user.id, this.pagination.page).subscribe(
      (data) => {
        const images = data.filter((image) => {
          return !(this.pagination.data.some((value) => image.id === value.id));
        });
        this.pagination.update(images);
      },
      (error) => console.error(`Error loading images: ${error.message}`)
    );
  }

  images() {
    return this.pagination.data;
  }

  count() {
    return this.pagination.count();
  }

  onNextClick() {
    this.loadNextPage();
  }
}
