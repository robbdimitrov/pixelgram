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
      if (!this.user || params.userId !== this.user.id) {
        this.loadUser(params.userId);
      }
    });
  }

  loadUser(userId: number) {
    this.apiClient.getUser(userId, true).subscribe(
      (value) => {
        this.user = value;
        this.pagination.reset();
        this.loadNextPage();
      },
      (error) => console.error(`Loading user failed: ${error.message}`)
    );
  }

  loadNextPage() {
    this.apiClient.getImages(this.user.id, this.pagination.page).subscribe(
      (value) => {
        const images = value.filter((image) => {
          return !(this.pagination.data.some((item) => image.id === item.id));
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
