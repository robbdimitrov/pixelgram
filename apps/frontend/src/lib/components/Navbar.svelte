<script lang="ts">
  import { page } from '$app/state';
  import { Camera, Home, SquarePlus, User } from '@lucide/svelte';
  import type { User as UserType } from '$lib/types';

  let { currentUser }: { currentUser: UserType } = $props();

  function isActive(path: string) {
    return page.url.pathname === path || page.url.pathname.startsWith(path + '/');
  }
</script>

<header class="relative z-10 mx-auto flex h-16 w-full items-center justify-between gap-3 rounded-full border border-base-300 bg-base-100/75 px-3 py-2 text-base-content shadow-lg shadow-slate-900/10 backdrop-blur-xl sm:px-5">
  <a class="flex min-w-0 items-center gap-2 no-underline transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] sm:gap-3" href="/" aria-label="PixelGram home">
    <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-neutral text-neutral-content shadow-md shadow-slate-900/15">
      <Camera class="h-5 w-5" />
    </span>
    <span class="hidden truncate text-2xl font-extrabold tracking-normal sm:inline sm:text-[1.5rem]">PixelGram</span>
  </a>

  <nav class="flex shrink-0 items-center gap-1 rounded-full bg-base-content/5 p-1 leading-none sm:gap-2" aria-label="Primary navigation">
    <a
      href="/feed"
      class="grid h-10 w-10 shrink-0 place-items-center rounded-full text-base-content/70 transition-colors hover:bg-base-100 hover:text-base-content dark:hover:bg-white/15"
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
      class="grid h-10 w-10 shrink-0 place-items-center rounded-full text-base-content/70 transition-colors hover:bg-base-100 hover:text-base-content dark:hover:bg-white/15"
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
      class="grid h-10 w-10 shrink-0 place-items-center rounded-full text-base-content/70 transition-colors hover:bg-base-100 hover:text-base-content dark:hover:bg-white/15"
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
