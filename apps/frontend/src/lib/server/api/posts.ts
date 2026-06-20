import type { Post, PostDto, PostIdDto, ImageFilenameDto, Comment, CommentDto, CursorPage } from '$lib/types';
import { mapPost, mapComment } from '$lib/utils/mappers';
import { unwrap, getCursorPage } from './http';

type Fetch = typeof globalThis.fetch;

export async function getFeed(fetch: Fetch, cursor?: string | null): Promise<CursorPage<Post>> {
  return getCursorPage(fetch, '/api/posts', cursor, mapPost);
}

export async function getUserPosts(
  fetch: Fetch,
  username: string,
  cursor?: string | null
): Promise<CursorPage<Post>> {
  return getCursorPage(fetch, `/api/users/${encodeURIComponent(username)}/posts`, cursor, mapPost);
}

export async function getLikedPosts(
  fetch: Fetch,
  username: string,
  cursor?: string | null
): Promise<CursorPage<Post>> {
  return getCursorPage(fetch, `/api/users/${encodeURIComponent(username)}/likes`, cursor, mapPost);
}

export async function getPost(fetch: Fetch, publicId: string): Promise<Post | null> {
  const res = await fetch(`/api/posts/${publicId}`);
  const dto = await unwrap<PostDto>(res);
  return dto ? mapPost(dto) : null;
}

export async function createPost(
  fetch: Fetch,
  filename: string,
  description: string
): Promise<PostIdDto | null> {
  const res = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ filename, description })
  });
  return unwrap<PostIdDto>(res);
}

export async function deletePost(fetch: Fetch, publicId: string): Promise<null> {
  const res = await fetch(`/api/posts/${publicId}`, { method: 'DELETE' });
  return unwrap<null>(res);
}

export async function likePost(fetch: Fetch, publicId: string): Promise<null> {
  const res = await fetch(`/api/posts/${publicId}/likes`, { method: 'POST', body: '' });
  return unwrap<null>(res);
}

export async function unlikePost(fetch: Fetch, publicId: string): Promise<null> {
  const res = await fetch(`/api/posts/${publicId}/likes`, { method: 'DELETE' });
  return unwrap<null>(res);
}

export async function getComments(
  fetch: Fetch,
  publicId: string,
  cursor?: string | null
): Promise<CursorPage<Comment>> {
  return getCursorPage(fetch, `/api/posts/${publicId}/comments`, cursor, mapComment);
}

export async function createComment(
  fetch: Fetch,
  publicId: string,
  body: string
): Promise<Comment | null> {
  const res = await fetch(`/api/posts/${publicId}/comments`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ body })
  });
  const dto = await unwrap<CommentDto>(res);
  return dto ? mapComment(dto) : null;
}

export async function deleteComment(
  fetch: Fetch,
  publicId: string,
  commentId: number
): Promise<null> {
  const res = await fetch(`/api/posts/${publicId}/comments/${commentId}`, { method: 'DELETE' });
  return unwrap<null>(res);
}

export async function uploadImage(fetch: Fetch, file: File): Promise<ImageFilenameDto | null> {
  const formData = new FormData();
  formData.append('image', file, file.name);
  const res = await fetch('/api/uploads', { method: 'POST', body: formData });
  return unwrap<ImageFilenameDto>(res);
}
