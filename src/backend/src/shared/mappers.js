function mapUser(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    likes: user.likes,
    images: user.images,
    created: user.created
  };
}

function mapImage(image) {
  return {
    id: image.id,
    userId: image.user_id,
    filename: image.filename,
    description: image.description,
    isLiked: image.is_liked,
    created: image.created
  };
}

function mapSession(session) {
  return {
    id: session.id,
    userId: session.user_id,
    userAgent: session.user_agent,
    created: session.created
  };
}

module.exports = {
  mapUser,
  mapImage,
  mapSession
};
