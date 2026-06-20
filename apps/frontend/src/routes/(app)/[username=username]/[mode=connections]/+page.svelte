<script lang="ts">
  import { enhance } from '$app/forms';
  import { createPagination } from '$lib/createPagination.svelte';
  import ProfileHeader from '$lib/components/ProfileHeader.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import { imageUrl } from '$lib/utils/imageUrl';
  import type { PageData } from './$types';
  import type { User } from '$lib/types';

  let { data } = $props<{ data: PageData }>();

  let profileUser = $state(data.profileUser);
  let isFollowPending = $state(false);
  let pendingFollowIds = $state(new Set<number>());

  const isCurrentUser = $derived(data.currentUser.id === profileUser.id);
  const username = $derived(profileUser.username);

  const pagination = createPagination(
    { items: data.users, nextCursor: data.nextCursor },
    async (cursor) => {
      const res = await fetch(`/@${username}/${data.mode}?cursor=${encodeURIComponent(cursor)}`);
      return res.json() as Promise<{ items: User[]; nextCursor: string | null }>;
    }
  );

  const emptyTitle = $derived(data.mode === 'followers' ? 'No followers yet' : 'Not following anyone yet');
  const emptyDesc = $derived(
    data.mode === 'followers'
      ? 'Followers will appear here as people follow this profile.'
      : 'Profiles this user follows will appear here.'
  );
</script>

<div class="mx-auto flex max-w-5xl flex-col gap-6">
  <ProfileHeader {profileUser} {isCurrentUser} bind:isFollowPending />

  <div class="h-px w-full bg-slate-200 dark:bg-white/10" aria-hidden="true"></div>

  <div class="tabs tabs-bordered justify-center font-bold">
    <a class="tab" href="/@{username}">Posts</a>
    <a class="tab" class:tab-active={data.mode === 'followers'} href="/@{username}/followers">Followers</a>
    <a class="tab" class:tab-active={data.mode === 'following'} href="/@{username}/following">Following</a>
  </div>

  {#if pagination.items.length > 0}
    <div class="mx-auto flex w-full max-w-xl flex-col gap-3">
      {#each pagination.items as user (user.id)}
        <div class="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 dark:border-white/10 dark:bg-slate-950">
          <a
            href="/@{user.username}"
            class="relative mt-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full border border-slate-200 transition-colors hover:border-slate-950 dark:border-white/15 dark:hover:border-white"
          >
            <img class="h-full w-full object-cover" src={imageUrl(user.avatar)} alt={user.username} loading="lazy" />
          </a>
          <a href="/@{user.username}" class="min-w-0 flex-1">
            <div class="truncate text-sm font-black text-slate-950 dark:text-white">{user.name || user.username}</div>
            <div class="truncate text-xs font-bold text-slate-500 dark:text-slate-400">@{user.username}</div>
            {#if user.bio}
              <p class="mt-2 max-h-10 overflow-hidden text-sm leading-5 text-slate-600 dark:text-slate-300">{user.bio}</p>
            {/if}
          </a>
          {#if data.currentUser.id !== user.id}
            <form
              method="POST"
              action="/@{username}?/{user.isFollowing ? 'unfollow' : 'follow'}"
              use:enhance={() => {
                pendingFollowIds = new Set([...pendingFollowIds, user.id]);
                return async () => {
                  pendingFollowIds = new Set([...pendingFollowIds].filter((id) => id !== user.id));
                };
              }}
            >
              <button
                type="submit"
                disabled={pendingFollowIds.has(user.id)}
                class="btn btn-sm h-9 min-h-9 shrink-0 rounded-full px-4 text-xs font-extrabold {user.isFollowing ? 'btn-outline' : 'btn-neutral'}"
              >
                {#if pendingFollowIds.has(user.id)}
                  <span class="loading loading-spinner loading-xs"></span>
                {:else}
                  {user.isFollowing ? 'Unfollow' : 'Follow'}
                {/if}
              </button>
            </form>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <div class="mx-auto w-full max-w-xl">
      <EmptyState
        icon="square-plus"
        title={emptyTitle}
        description={emptyDesc}
        actionLabel="Browse Feed"
        actionRoute="/feed"
        actionStyle="outline"
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
