class Image {
  constructor(id, ownerId, filename, dateCreated, description, likedUsers) {
    this.id = id;
    this.ownerId = ownerId;
    this.filename = filename;
    this.dateCreated = dateCreated;
    this.description = description;
    this.likedUsers = likedUsers;
  }
}

module.exports = Image;
