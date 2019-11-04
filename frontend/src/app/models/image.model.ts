export class Image {
  constructor(
    public id: string,
    public owner: string,
    public filename: string,
    public description: string,
    public likes: number,
    public isLiked: boolean,
    public createdAt: Date
  ) {}
}
