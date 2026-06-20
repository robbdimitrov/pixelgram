<script lang="ts">
  import { enhance } from '$app/forms';
  import { ArrowLeft } from '@lucide/svelte';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();

  let showOldPassword = $state(false);
  let showNewPassword = $state(false);
  let submitting = $state(false);
  let errorMessage = $state(form?.error ?? '');
</script>

<div class="rounded-2xl border border-slate-200 bg-white text-slate-950 dark:border-white/10 dark:bg-slate-950 dark:text-white mx-auto flex max-w-xl flex-col gap-6 p-6 shadow-lg shadow-slate-900/5 sm:px-8">
  <div class="flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-white/10">
    <a href="/settings" class="btn btn-ghost btn-circle btn-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white" title="Back to Settings">
      <ArrowLeft class="h-5 w-5" />
    </a>
    <h1 class="text-2xl font-black text-slate-950 dark:text-white">Change Password</h1>
  </div>

  <form
    method="POST"
    class="grid gap-6"
    use:enhance={() => {
      submitting = true;
      errorMessage = '';
      return async ({ result, update }) => {
        submitting = false;
        if (result.type === 'failure') {
          errorMessage = (result.data as { error?: string })?.error ?? 'Could not update password.';
        }
        await update();
      };
    }}
  >
    {#if errorMessage || form?.error}
      <div class="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm font-semibold text-error">
        {errorMessage || form?.error}
      </div>
    {/if}

    <div class="form-control grid gap-2">
      <label for="old-password" class="label p-0">
        <span class="label-text text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Current Password</span>
      </label>
      <div class="relative flex items-center">
        <input
          type={showOldPassword ? 'text' : 'password'}
          id="old-password"
          name="oldPassword"
          placeholder="Current password"
          autocomplete="current-password"
          required
          class="input input-bordered w-full rounded-xl border-slate-300 bg-white pr-20 text-slate-950 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none dark:border-white/15 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white/30"
        />
        <button
          type="button"
          class="btn btn-ghost absolute right-1.5 h-10 min-h-10 rounded-full px-4 text-sm font-extrabold text-slate-950 hover:bg-slate-100 dark:text-white dark:hover:bg-white/10"
          onclick={() => (showOldPassword = !showOldPassword)}
        >
          {showOldPassword ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>

    <div class="form-control grid gap-2">
      <label for="password" class="label p-0">
        <span class="label-text text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">New Password</span>
      </label>
      <div class="relative flex items-center">
        <input
          type={showNewPassword ? 'text' : 'password'}
          id="password"
          name="password"
          placeholder="New password"
          minlength="8"
          maxlength="30"
          autocomplete="new-password"
          required
          class="input input-bordered w-full rounded-xl border-slate-300 bg-white pr-20 text-slate-950 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none dark:border-white/15 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white/30"
        />
        <button
          type="button"
          class="btn btn-ghost absolute right-1.5 h-10 min-h-10 rounded-full px-4 text-sm font-extrabold text-slate-950 hover:bg-slate-100 dark:text-white dark:hover:bg-white/10"
          onclick={() => (showNewPassword = !showNewPassword)}
        >
          {showNewPassword ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>

    <button
      type="submit"
      disabled={submitting}
      class="btn h-12 min-h-12 w-full rounded-full border-0 bg-slate-950 text-base font-extrabold text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
    >
      {submitting ? 'Updating Password...' : 'Update Password'}
    </button>
  </form>
</div>
