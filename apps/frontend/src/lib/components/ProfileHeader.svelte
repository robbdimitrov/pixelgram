<script lang="ts">
  import { enhance } from '$app/forms';
  import { Settings } from '@lucide/svelte';
  import { imageUrl } from '$lib/utils/imageUrl';
  import { pluralize } from '$lib/utils/pluralize';
  import type { User } from '$lib/types';

  let {
    profileUser = $bindable(),
    isCurrentUser,
    isFollowPending = $bindable(false)
  } = $props<{
    profileUser: User;
    isCurrentUser: boolean;
    isFollowPending?: boolean;
  }>();
</script>

<div class="flex w-full flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-white p-6 text-slate-950 shadow-lg shadow-slate-900/5 dark:border-white/10 dark:bg-slate-950 dark:text-white sm:px-8 md:flex-row md:items-start">
  <div class="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-slate-200 shadow-md dark:border-white/15 sm:h-28 sm:w-28">
    <img class="h-full w-full object-cover" src={imageUrl(profileUser.avatar)} alt={profileUser.username} />
  </div>

  <div class="flex w-full flex-grow flex-col gap-4 text-center md:text-left">
    <div class="flex w-full flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between sm:text-left">
      <div class="grid min-w-0 gap-1">
        <h1 class="break-words text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
          {profileUser.name || profileUser.username}
        </h1>
        <p class="break-words text-sm font-bold text-slate-500 dark:text-slate-400">@{profileUser.username}</p>
      </div>

      {#if isCurrentUser}
        <a
          href="/settings"
          class="btn btn-sm inline-flex h-10 min-h-10 shrink-0 items-center justify-center gap-2 rounded-full border-0 bg-slate-950 px-5 font-extrabold leading-none text-white shadow-md shadow-slate-900/15 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          <Settings class="h-4 w-4" />
          Settings
        </a>
      {:else}
        <form
          method="POST"
          action={profileUser.isFollowing ? '?/unfollow' : '?/follow'}
          use:enhance={() => {
            isFollowPending = true;
            const wasFollowing = profileUser.isFollowing;
            profileUser = { ...profileUser, isFollowing: !wasFollowing, followers: profileUser.followers + (wasFollowing ? -1 : 1) };
            return async ({ result }) => {
              isFollowPending = false;
              if (result.type === 'error' || result.type === 'failure') {
                profileUser = { ...profileUser, isFollowing: wasFollowing, followers: profileUser.followers + (wasFollowing ? 1 : -1) };
              }
            };
          }}
        >
          <button
            type="submit"
            disabled={isFollowPending}
            class="btn btn-sm inline-flex h-10 min-h-10 shrink-0 items-center justify-center gap-2 rounded-full border-0 px-5 font-extrabold leading-none shadow-md shadow-slate-900/15 transition-colors {profileUser.isFollowing ? 'bg-slate-200 text-slate-950 hover:bg-slate-300 dark:bg-white/20 dark:text-white dark:hover:bg-white/30' : 'bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200'}"
          >
            {profileUser.isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        </form>
      {/if}
    </div>

    {#if profileUser.bio}
      <p class="w-full max-w-xl whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {profileUser.bio}
      </p>
    {/if}

    <div class="flex items-center justify-center gap-6 text-sm font-bold text-slate-600 dark:text-slate-300 md:justify-start">
      <a href="/@{profileUser.username}" class="transition-colors hover:text-slate-950 dark:hover:text-white">
        <strong class="font-black text-slate-950 dark:text-white">{profileUser.posts}</strong> {pluralize(profileUser.posts, 'post')}
      </a>
      <a href="/@{profileUser.username}/likes" class="transition-colors hover:text-slate-950 dark:hover:text-white">
        <strong class="font-black text-slate-950 dark:text-white">{profileUser.likes}</strong> {pluralize(profileUser.likes, 'like')}
      </a>
      <a href="/@{profileUser.username}/followers" class="transition-colors hover:text-slate-950 dark:hover:text-white">
        <strong class="font-black text-slate-950 dark:text-white">{profileUser.followers}</strong> {pluralize(profileUser.followers, 'follower')}
      </a>
      <a href="/@{profileUser.username}/following" class="transition-colors hover:text-slate-950 dark:hover:text-white">
        <strong class="font-black text-slate-950 dark:text-white">{profileUser.following}</strong> following
      </a>
    </div>
  </div>
</div>
