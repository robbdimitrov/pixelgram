import { Injectable } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faChevronDown, faHeart,
  faCog, faChevronRight,
  faCameraRetro, faHome, faUser
} from '@fortawesome/free-solid-svg-icons';
import {
  faHeart as farHeart,
  faPlusSquare as farPlusSquare
} from '@fortawesome/free-regular-svg-icons';

@Injectable()
export class IconLibrary {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faChevronDown, faHeart, faCog,
      faChevronRight, faCameraRetro,
      faHome, faUser, farHeart,
      farPlusSquare
    );
  }
}
