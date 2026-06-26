export interface CursorPage<T> {
	items: T[];
	nextCursor: string | null;
}

export interface UserIdDto {
	id: number;
}

export interface UserDto {
	id: number;
	name: string;
	username: string;
	email: string;
	avatar: string | null;
	bio: string | null;
	posts: number;
	likes: number;
	followers: number;
	following: number;
	isFollowing: boolean;
	created: string;
}

export interface User {
	id: number;
	name: string;
	username: string;
	email?: string;
	avatar: string | null;
	bio: string | null;
	posts: number;
	likes: number;
	followers: number;
	following: number;
	isFollowing: boolean;
	created: Date;
}

export interface PostIdDto {
	publicId: string;
}

export interface PostDto {
	publicId: string;
	userId: number;
	username: string;
	name: string;
	avatar: string | null;
	filename: string;
	description: string | null;
	likes: number;
	liked: boolean;
	comments: number;
	created: string;
}

export interface ImageFilenameDto {
	filename: string;
}

export interface Post {
	publicId: string;
	userId: number;
	username: string;
	name: string;
	avatar: string | null;
	filename: string;
	description: string | null;
	likes: number;
	liked: boolean;
	comments: number;
	created: Date;
}

export interface CommentDto {
	id: number;
	userId: number;
	username: string;
	avatar: string | null;
	body: string;
	created: string;
}

export interface Comment {
	id: number;
	userId: number;
	username: string;
	avatar: string | null;
	body: string;
	created: Date;
}

export interface SessionDto {
	id: string;
	created: string;
	expiresAt: string;
	current: boolean;
}

export interface Session {
	id: string;
	created: Date;
	expiresAt: Date;
	current: boolean;
}

export type NotificationType = 'like' | 'comment' | 'follow';

export interface NotificationDto {
	id: number;
	externalId: string;
	userId: number;
	actorId: number;
	type: NotificationType;
	entityId: string;
	read: boolean;
	created: string;
}

export interface Notification {
	id: number;
	externalId: string;
	userId: number;
	actorId: number;
	type: NotificationType;
	entityId: string;
	read: boolean;
	created: Date;
}
