<script lang="ts">
	import { createPagination } from '$lib/createPagination.svelte';
	import PostCard from '$lib/components/PostCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import LoadMoreButton from '$lib/components/LoadMoreButton.svelte';
	import { fetchJson } from '$lib/utils/clientFetch';
	import type { PageData } from './$types';
	import type { Post } from '$lib/types';

	let { data }: { data: PageData } = $props();

	const pagination = createPagination(
		() => ({ items: data.posts, nextCursor: data.nextCursor }),
		async (cursor) => {
			const res = await fetch(`/feed?cursor=${encodeURIComponent(cursor)}`);
			return fetchJson<{ items: Post[]; nextCursor: string | null }>(res);
		}
	);
</script>

<svelte:head>
	<title>Feed — PixelGram</title>
</svelte:head>

<div class="mx-auto flex max-w-xl flex-col items-center gap-6">
	{#if pagination.items.length === 0}
		<EmptyState
			icon="square-plus"
			title="Ready for your first post?"
			description="Start your PixelGram feed with a photo worth sharing."
			actionLabel="Share Your First Photo"
			actionRoute="/upload"
		/>
	{/if}

	<div class="flex w-full flex-col gap-6">
		{#each pagination.items as post (post.id)}
			<PostCard {post} currentUserId={data.currentUser.id} singleView={false} />
		{/each}
	</div>

	{#if !pagination.done && pagination.items.length > 0}
		{#if pagination.error}
			<p class="text-sm text-error">{pagination.error}</p>
		{/if}
		<LoadMoreButton loading={pagination.loading} onclick={pagination.more} />
	{/if}
</div>
