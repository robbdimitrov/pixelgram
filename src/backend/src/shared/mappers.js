function mapUser(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    images: +user.images,
    likes: +user.likes,
    created: user.created
  };
}

function mapSession(session) {
  return {
    id: session.id,
    userId: session.user_id,
    created: session.created
  };
}

function mapImage(image) {
  return {
    id: image.id,
    userId: image.user_id,
    filename: image.filename,
    description: image.description,
    likes: +image.likes,
    liked: image.liked,
    created: image.created
  };
}

module.exports = {
  mapUser,
  mapSession,
  mapImage
};
