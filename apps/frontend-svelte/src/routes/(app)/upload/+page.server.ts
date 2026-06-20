import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { uploadImage, createPost } from '$lib/server/api/posts';

export const actions: Actions = {
  default: async ({ fetch, request }) => {
    const data = await request.formData();
    const file = data.get('image');
    const description = ((data.get('description') as string) ?? '').trim();

    if (!file || !(file instanceof File) || file.size === 0) {
      return fail(400, { error: 'Please select an image.' });
    }

    const uploaded = await uploadImage(fetch, file);
    if (!uploaded) {
      return fail(500, { error: 'Image upload failed. Please try again.' });
    }

    const post = await createPost(fetch, uploaded.filename, description);
    if (!post) {
      return fail(500, { error: 'Could not create post. Please try again.' });
    }

    throw redirect(303, '/feed');
  }
};
