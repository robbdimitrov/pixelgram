export class Image {
  constructor(
    public id: string,
    public userId: string,
    public filename: string,
    public description: string,
    public likes: number,
    public isLiked: boolean,
    public created: Date
  ) {}
}
