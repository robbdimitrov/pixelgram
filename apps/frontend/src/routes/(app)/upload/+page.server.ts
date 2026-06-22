import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { uploadImage, createPost } from '$lib/server/api/posts';
import { apiClient } from '$lib/server/api/client';

export const actions: Actions = {
	default: async ({ fetch, cookies, request }) => {
		const api = apiClient({ fetch, cookies });
		const data = await request.formData();
		const file = data.get('image');
		const description = ((data.get('description') as string) ?? '').trim();

		if (!file || !(file instanceof File) || file.size === 0) {
			return fail(400, { error: 'Please select an image.' });
		}

		const uploaded = await uploadImage(api, file);
		if (!uploaded) {
			return fail(500, { error: 'Image upload failed. Please try again.' });
		}

		const post = await createPost(api, uploaded.filename, description);
		if (!post) {
			return fail(500, { error: 'Could not create post. Please try again.' });
		}

		throw redirect(303, '/feed');
	}
};
