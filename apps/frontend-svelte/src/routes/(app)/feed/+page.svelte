<script lang="ts">
  import { createPagination } from '$lib/createPagination.svelte';
  import PostCard from '$lib/components/PostCard.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import type { PageData } from './$types';
  import type { Post } from '$lib/types';

  let { data } = $props<{ data: PageData }>();

  const pagination = createPagination(
    { items: data.posts, nextCursor: data.nextCursor },
    async (cursor) => {
      const res = await fetch(`/feed?cursor=${encodeURIComponent(cursor)}`);
      return res.json() as Promise<{ items: Post[]; nextCursor: string | null }>;
    }
  );
</script>

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
    <button
      class="btn btn-outline btn-primary rounded-xl px-8 font-bold transition-transform hover:scale-105 active:scale-95"
      onclick={() => pagination.more()}
      disabled={pagination.loading}
    >
      {#if pagination.loading}
        <span class="loading loading-spinner"></span>
      {:else}
        Load More
      {/if}
    </button>
  {/if}
</div>
