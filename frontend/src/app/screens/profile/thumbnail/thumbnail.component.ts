import { Component, Input, Output, EventEmitter } from "@angular/core";

import { Image } from "../../../models/image.model";

@Component({
    selector: "pg-thumbnail",
    templateUrl: "./thumbnail.component.html",
    styleUrls: ["./thumbnail.component.scss"]
})
export class ThumbnailComponent {

    @Input() image: Image;
    @Output() openImage = new EventEmitter<string>();

    onClick() {
        this.openImage.emit(this.image.id);
    }

}
