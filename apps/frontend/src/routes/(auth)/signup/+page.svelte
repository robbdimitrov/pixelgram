<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();

  let showPassword = $state(false);
  let submitting = $state(false);
</script>

<svelte:head>
  <title>Sign up — PixelGram</title>
</svelte:head>

<section class="mx-auto grid w-full max-w-xl gap-6 rounded-2xl border border-slate-200 bg-white/90 p-6 text-slate-950 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90 dark:text-white dark:shadow-black/35 sm:px-8">
  <div class="grid gap-3">
    <span class="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Join PixelGram</span>
    <h1 class="text-3xl font-extrabold leading-tight tracking-normal text-slate-950 dark:text-white sm:text-4xl">Create your account</h1>
    <p class="text-base leading-7 text-slate-600 dark:text-slate-300">
      Start a photo journal, publish your best moments, and make your profile yours.
    </p>
  </div>

  <form
    method="POST"
    class="grid gap-6"
    use:enhance={() => {
      submitting = true;
      return async ({ update }) => {
        submitting = false;
        await update();
      };
    }}
  >
    {#if form?.error}
      <div class="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm font-semibold text-error">
        {form.error}
      </div>
    {/if}

    <div class="form-control grid gap-2">
      <label for="name" class="label p-0">
        <span class="label-text text-xs font-extrabold uppercase tracking-widest text-slate-700 dark:text-slate-200">Full Name</span>
      </label>
      <input
        type="text"
        id="name"
        name="name"
        placeholder="John Doe"
        autocomplete="name"
        required
        class="input input-bordered w-full rounded-xl border-slate-300 bg-white text-slate-950 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none dark:border-white/15 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white/30"
      />
    </div>

    <div class="form-control grid gap-2">
      <label for="username" class="label p-0">
        <span class="label-text text-xs font-extrabold uppercase tracking-widest text-slate-700 dark:text-slate-200">Username</span>
      </label>
      <input
        type="text"
        id="username"
        name="username"
        placeholder="johndoe"
        autocomplete="username"
        pattern="[a-z0-9._]&#123;3,30&#125;"
        minlength="3"
        maxlength="30"
        required
        class="input input-bordered w-full rounded-xl border-slate-300 bg-white text-slate-950 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none dark:border-white/15 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white/30"
      />
    </div>

    <div class="form-control grid gap-2">
      <label for="email" class="label p-0">
        <span class="label-text text-xs font-extrabold uppercase tracking-widest text-slate-700 dark:text-slate-200">Email Address</span>
      </label>
      <input
        type="email"
        id="email"
        name="email"
        placeholder="johndoe@mail.com"
        pattern="[^@]+@[^@]+\.[^@]+"
        autocomplete="email"
        required
        class="input input-bordered w-full rounded-xl border-slate-300 bg-white text-slate-950 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none dark:border-white/15 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white/30"
      />
    </div>

    <div class="form-control grid gap-2">
      <label for="password" class="label p-0">
        <span class="label-text text-xs font-extrabold uppercase tracking-widest text-slate-700 dark:text-slate-200">Password</span>
      </label>
      <div class="relative flex items-center">
        <input
          type={showPassword ? 'text' : 'password'}
          id="password"
          name="password"
          placeholder="Password"
          minlength="8"
          maxlength="30"
          autocomplete="new-password"
          required
          class="input input-bordered w-full rounded-xl border-slate-300 bg-white pr-20 text-slate-950 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none dark:border-white/15 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white/30"
        />
        <button
          type="button"
          class="btn btn-ghost absolute right-1.5 h-10 min-h-10 rounded-full px-4 text-sm font-extrabold text-slate-950 hover:bg-slate-100 dark:text-white dark:hover:bg-white/10"
          onclick={() => (showPassword = !showPassword)}
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>

    <button
      type="submit"
      disabled={submitting}
      class="btn h-12 min-h-12 w-full rounded-full border-0 bg-slate-950 text-base font-extrabold text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
    >
      {submitting ? 'Creating Account...' : 'Create Account'}
    </button>
  </form>

  <div class="grid gap-3 border-t border-slate-200 pt-6 text-center dark:border-white/10">
    <span class="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Already registered?</span>
    <p class="text-sm text-slate-600 dark:text-slate-300">
      Already have an account?
      <a href="/login" class="ml-1 font-extrabold text-slate-950 hover:text-primary dark:text-white dark:hover:text-primary">Log in</a>
    </p>
  </div>
</section>
