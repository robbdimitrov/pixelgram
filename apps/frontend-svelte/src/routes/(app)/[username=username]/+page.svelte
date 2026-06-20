<script lang="ts">
  import { createPagination } from '$lib/createPagination.svelte';
  import ProfileHeader from '$lib/components/ProfileHeader.svelte';
  import Thumbnail from '$lib/components/Thumbnail.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import type { PageData } from './$types';
  import type { Post } from '$lib/types';

  let { data } = $props<{ data: PageData }>();

  let profileUser = $derived(data.profileUser);
  let isFollowPending = $state(false);

  const pagination = createPagination(
    { items: data.posts, nextCursor: data.nextCursor },
    async (cursor) => {
      const res = await fetch(`/@${data.profileUser.username}?cursor=${encodeURIComponent(cursor)}`);
      return res.json() as Promise<{ items: Post[]; nextCursor: string | null }>;
    }
  );

  const isCurrentUser = $derived(data.currentUser.id === profileUser.id);
  const username = $derived(profileUser.username);
</script>

<div class="mx-auto flex max-w-5xl flex-col gap-6">
  <ProfileHeader {profileUser} {isCurrentUser} bind:isFollowPending />

  <div class="h-px w-full bg-slate-200 dark:bg-white/10" aria-hidden="true"></div>

  <div class="tabs tabs-bordered justify-center font-bold">
    <a class="tab tab-active" href="/@{username}">Posts</a>
    <a class="tab" href="/@{username}/followers">Followers</a>
    <a class="tab" href="/@{username}/following">Following</a>
  </div>

  {#if pagination.items.length > 0}
    <div class="grid grid-cols-3 gap-2 sm:gap-4">
      {#each pagination.items as post (post.id)}
        <div class="aspect-square">
          <Thumbnail {post} />
        </div>
      {/each}
    </div>
  {:else}
    <div class="mx-auto w-full max-w-xl">
      <EmptyState
        icon="camera"
        title="No uploads yet"
        description={isCurrentUser ? 'Your profile is ready. Share your first photo to start building your grid.' : 'This profile has not shared any photos yet.'}
        actionLabel={isCurrentUser ? 'Share Your First Photo' : 'Browse Feed'}
        actionRoute={isCurrentUser ? '/upload' : '/feed'}
        actionStyle={isCurrentUser ? 'primary' : 'outline'}
      />
    </div>
  {/if}

  {#if !pagination.done && pagination.items.length > 0}
    <div class="flex justify-center">
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
    </div>
  {/if}
</div>
