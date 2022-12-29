export interface ImageDto {
  id: number;
  userId: number;
  filename: string;
  description: string;
  likes: number;
  liked: boolean;
  created: string;
}

export interface ImagesDto {
  items: ImageDto[];
}

export interface ImageFilenameDto {
  filename: string;
}

export class Image {
  constructor(
    public id: number,
    public userId: number,
    public filename: string,
    public description: string,
    public likes: number,
    public liked: boolean,
    public created: Date
  ) {}
}
