import { Component, Input, Output } from '@angular/core';
import { EventEmitter } from '@angular/core';

import { Image } from '../../../models/image.model';
import { Session } from '../../../services/session.service';

@Component({
    selector: 'pg-image',
    templateUrl: './image.component.html',
    styleUrls: ['./image.component.scss']
})
export class ImageComponent {

    @Output() like = new EventEmitter<string>();
    @Output() unlike = new EventEmitter<string>();
    @Output() showProfile = new EventEmitter<string>();
    @Output() deleteAction = new EventEmitter<Image>();
    @Input() image: Image;
    optionsOpened = false;

    constructor(private session: Session) {}

    onLikeClick() {
        this.image.isLiked = !this.image.isLiked;
        this.image.likes += (this.image.isLiked ? 1 : -1);
        if (this.image.isLiked) {
            this.like.emit(this.image.id);
        } else {
            this.unlike.emit(this.image.id);
        }
    }

    isOwnedByCurrentUser() {
        return this.session.userId() === this.image.owner;
    }

    isDescriptionPresent() {
        return this.image.description.length > 0;
    }

    onProfileClick() {
        this.showProfile.emit(this.image.owner);
    }

    onDeleteClick() {
        this.deleteAction.emit(this.image);
    }

}
