export class User {
  constructor(id, name, username, email, password, bio,
    avatar, likedImages, postedImages, registrationDate) {
    this.id = id;
    this.name = name;
    this.username = username;
    this.email = email;
    this.password = password;
    this.bio = bio;
    this.avatar = avatar;
    this.likedImages = likedImages;
    this.postedImages = postedImages;
    this.registrationDate = registrationDate;
  }
}
