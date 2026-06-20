<script lang="ts">
  import { page } from '$app/state';
  import { Camera, Home, SquarePlus, User } from '@lucide/svelte';
  import type { User as UserType } from '$lib/types';

  let { currentUser }: { currentUser: UserType } = $props();

  function isActive(path: string) {
    return page.url.pathname === path || page.url.pathname.startsWith(path + '/');
  }
</script>

<header class="relative z-10 mx-auto flex h-16 w-full items-center justify-between gap-3 rounded-full border border-slate-200 bg-white/75 px-3 py-2 text-slate-950 shadow-lg shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75 dark:text-white sm:px-5">
  <a class="flex min-w-0 items-center gap-2 no-underline transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] sm:gap-3" href="/" aria-label="PixelGram home">
    <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-950 text-white shadow-md shadow-slate-900/15 dark:bg-white dark:text-slate-950">
      <Camera class="h-5 w-5" />
    </span>
    <span class="hidden truncate text-2xl font-extrabold tracking-normal sm:inline sm:text-[1.5rem]">PixelGram</span>
  </a>

  <nav class="flex shrink-0 items-center gap-1 rounded-full bg-slate-950/5 p-1 leading-none dark:bg-white/5 sm:gap-2" aria-label="Primary navigation">
    <a
      href="/feed"
      class="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate-700 transition-colors hover:bg-white hover:text-slate-950 dark:text-slate-200 dark:hover:bg-white/15 dark:hover:text-white"
      class:bg-white={isActive('/feed')}
      class:text-slate-950={isActive('/feed')}
      class:shadow-md={isActive('/feed')}
      title="Home"
      aria-label="Home"
    >
      <Home class="h-5 w-5" />
    </a>

    <a
      href="/upload"
      class="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate-700 transition-colors hover:bg-white hover:text-slate-950 dark:text-slate-200 dark:hover:bg-white/15 dark:hover:text-white"
      class:bg-white={isActive('/upload')}
      class:text-slate-950={isActive('/upload')}
      class:shadow-md={isActive('/upload')}
      title="Upload"
      aria-label="Upload"
    >
      <SquarePlus class="h-5 w-5" />
    </a>

    <a
      href="/@{currentUser.username}"
      class="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate-700 transition-colors hover:bg-white hover:text-slate-950 dark:text-slate-200 dark:hover:bg-white/15 dark:hover:text-white"
      class:bg-white={isActive('/@' + currentUser.username)}
      class:text-slate-950={isActive('/@' + currentUser.username)}
      class:shadow-md={isActive('/@' + currentUser.username)}
      title="Profile"
      aria-label="Profile"
    >
      <User class="h-5 w-5" />
    </a>
  </nav>
</header>
