import { Component, Input, Output } from '@angular/core';
import { EventEmitter } from '@angular/core';

import { Image } from '../../../models/image.model';
import { User } from '../../../models/user.model';
import { Session } from '../../../services/session.service';

@Component({
  selector: 'app-image',
  templateUrl: './image.component.html',
  styleUrls: ['./image.component.scss']
})
export class ImageComponent {
  @Output() like = new EventEmitter<number>();
  @Output() unlike = new EventEmitter<number>();
  @Output() deleteAction = new EventEmitter<Image>();
  @Input() image: Image;
  @Input() user: User;
  optionsOpened = false;

  constructor(private session: Session) {}

  onLikeClick() {
    this.image.liked = !this.image.liked;
    this.image.likes += (this.image.liked ? 1 : -1);
    if (this.image.liked) {
      this.like.emit(this.image.id);
    } else {
      this.unlike.emit(this.image.id);
    }
  }

  isOwnedByCurrentUser() {
    return this.session.userId() === this.image.userId;
  }

  isDescriptionPresent() {
    return this.image.description.length > 0;
  }

  onDeleteClick() {
    this.deleteAction.emit(this.image);
  }
}
