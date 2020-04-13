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
