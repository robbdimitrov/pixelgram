import type {
	Post,
	PostDto,
	PostIdDto,
	ImageFilenameDto,
	Comment,
	CommentDto,
	CursorPage
} from '$lib/types';
import { mapPost, mapComment } from '$lib/utils/mappers';
import { unwrap, getCursorPage } from './http';
import type { ApiClient } from './client';

export async function getFeed(fetch: ApiClient, cursor?: string | null): Promise<CursorPage<Post>> {
	return getCursorPage(fetch, '/feed', cursor, mapPost);
}

export async function getUserPosts(
	fetch: ApiClient,
	username: string,
	cursor?: string | null
): Promise<CursorPage<Post>> {
	return getCursorPage(fetch, `/users/${encodeURIComponent(username)}/posts`, cursor, mapPost);
}

export async function getLikedPosts(
	fetch: ApiClient,
	username: string,
	cursor?: string | null
): Promise<CursorPage<Post>> {
	return getCursorPage(fetch, `/users/${encodeURIComponent(username)}/likes`, cursor, mapPost);
}

export async function getPost(fetch: ApiClient, publicId: string): Promise<Post | null> {
	const res = await fetch(`/posts/${publicId}`);
	const dto = await unwrap<PostDto>(res);
	return dto ? mapPost(dto) : null;
}

export async function createPost(
	fetch: ApiClient,
	filename: string,
	description: string
): Promise<PostIdDto | null> {
	const res = await fetch('/posts', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ filename, description })
	});
	return unwrap<PostIdDto>(res);
}

export async function deletePost(fetch: ApiClient, publicId: string): Promise<null> {
	const res = await fetch(`/posts/${publicId}`, { method: 'DELETE' });
	return unwrap<null>(res);
}

export async function likePost(fetch: ApiClient, publicId: string): Promise<null> {
	const res = await fetch(`/posts/${publicId}/likes`, { method: 'POST', body: '' });
	return unwrap<null>(res);
}

export async function unlikePost(fetch: ApiClient, publicId: string): Promise<null> {
	const res = await fetch(`/posts/${publicId}/likes`, { method: 'DELETE' });
	return unwrap<null>(res);
}

export async function getComments(
	fetch: ApiClient,
	publicId: string,
	cursor?: string | null
): Promise<CursorPage<Comment>> {
	return getCursorPage(fetch, `/posts/${publicId}/comments`, cursor, mapComment);
}

export async function createComment(
	fetch: ApiClient,
	publicId: string,
	body: string
): Promise<Comment | null> {
	const res = await fetch(`/posts/${publicId}/comments`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ body })
	});
	const dto = await unwrap<CommentDto>(res);
	return dto ? mapComment(dto) : null;
}

export async function deleteComment(
	fetch: ApiClient,
	publicId: string,
	commentId: number
): Promise<null> {
	const res = await fetch(`/posts/${publicId}/comments/${commentId}`, { method: 'DELETE' });
	return unwrap<null>(res);
}

export async function uploadImage(fetch: ApiClient, file: File): Promise<ImageFilenameDto | null> {
	const formData = new FormData();
	formData.append('image', file, file.name);
	const res = await fetch('/uploads', { method: 'POST', body: formData });
	return unwrap<ImageFilenameDto>(res);
}
