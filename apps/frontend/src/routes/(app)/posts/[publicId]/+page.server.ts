import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	getPost,
	getComments,
	likePost,
	unlikePost,
	createComment,
	deleteComment,
	deletePost
} from '$lib/server/api/posts';
import { apiClient } from '$lib/server/api/client';

export const load: PageServerLoad = async ({ fetch, cookies, params }) => {
	const api = apiClient({ fetch, cookies });
	const [post, commentsPage] = await Promise.all([
		getPost(api, params.publicId),
		getComments(api, params.publicId)
	]);
	if (!post) throw error(404, 'Post not found');
	return {
		post,
		comments: commentsPage.items,
		nextCommentsCursor: commentsPage.nextCursor
	};
};

export const actions: Actions = {
	like: async ({ fetch, cookies, params }) => {
		await likePost(apiClient({ fetch, cookies }), params.publicId);
		return { success: true };
	},
	unlike: async ({ fetch, cookies, params }) => {
		await unlikePost(apiClient({ fetch, cookies }), params.publicId);
		return { success: true };
	},
	comment: async ({ fetch, cookies, request, params }) => {
		const data = await request.formData();
		const body = ((data.get('body') as string) ?? '').trim();
		if (!body || body.length > 400)
			return fail(400, { error: 'Comment must be 1–400 characters.' });
		const comment = await createComment(apiClient({ fetch, cookies }), params.publicId, body);
		return { success: true, comment };
	},
	deleteComment: async ({ fetch, cookies, request, params }) => {
		const data = await request.formData();
		const commentId = (data.get('commentId') as string) ?? '';
		if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(commentId))
			return fail(400, { error: 'Invalid comment ID.' });
		await deleteComment(apiClient({ fetch, cookies }), params.publicId, commentId);
		return { success: true };
	},
	deletePost: async ({ fetch, cookies, params }) => {
		await deletePost(apiClient({ fetch, cookies }), params.publicId);
		throw redirect(303, '/feed');
	}
};
