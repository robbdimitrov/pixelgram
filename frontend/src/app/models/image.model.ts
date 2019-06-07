export class Image {
  constructor(
    public id: string,
    public owner: string,
    public filename: string,
    public dateCreated: Date,
    public description: string,
    public likes: number,
    public isLiked: boolean
  ) {}
}
