import { error, redirect } from '@sveltejs/kit';
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

export const load: PageServerLoad = async ({ fetch, params }) => {
  const [post, commentsPage] = await Promise.all([
    getPost(fetch, params.publicId),
    getComments(fetch, params.publicId)
  ]);
  if (!post) throw error(404, 'Post not found');
  return {
    post,
    comments: commentsPage.items,
    nextCommentsCursor: commentsPage.nextCursor
  };
};

export const actions: Actions = {
  like: async ({ fetch, params }) => {
    await likePost(fetch, params.publicId);
    return { success: true };
  },
  unlike: async ({ fetch, params }) => {
    await unlikePost(fetch, params.publicId);
    return { success: true };
  },
  comment: async ({ fetch, request, params }) => {
    const data = await request.formData();
    const body = (data.get('body') as string ?? '').trim();
    if (!body) return { success: false };
    await createComment(fetch, params.publicId, body);
    return { success: true };
  },
  deleteComment: async ({ fetch, request, params }) => {
    const data = await request.formData();
    const commentId = Number(data.get('commentId'));
    await deleteComment(fetch, params.publicId, commentId);
    return { success: true };
  },
  deletePost: async ({ fetch, params }) => {
    await deletePost(fetch, params.publicId);
    throw redirect(303, '/feed');
  }
};
