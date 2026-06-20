<script lang="ts">
  import { page } from '$app/state';
</script>

<svelte:head>
  <title>{page.status} — PixelGram</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-base-200 p-4">
  <div class="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-950 shadow-xl shadow-slate-900/5 dark:border-white/10 dark:bg-slate-950 dark:text-white">
    <div class="grid h-16 w-16 place-items-center rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950">
      <span class="text-2xl font-black">{page.status}</span>
    </div>
    <div class="grid gap-2">
      <h1 class="text-2xl font-black">
        {#if page.status === 404}
          Page not found
        {:else if page.status === 403}
          Access denied
        {:else}
          Something went wrong
        {/if}
      </h1>
      <p class="text-sm leading-6 text-slate-600 dark:text-slate-300">
        {page.error?.message ?? 'An unexpected error occurred.'}
      </p>
    </div>
    <a
      href="/feed"
      class="btn h-11 min-h-11 rounded-full border-0 bg-slate-950 px-6 font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
    >
      Back to Feed
    </a>
  </div>
</div>
