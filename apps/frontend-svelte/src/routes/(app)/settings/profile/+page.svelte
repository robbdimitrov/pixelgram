<script lang="ts">
  import { enhance } from '$app/forms';
  import { ArrowLeft, Camera, Trash2 } from '@lucide/svelte';
  import { resizeImageForUpload } from '$lib/utils/image-resizer';
  import { imageUrl } from '$lib/utils/imageUrl';
  import type { PageData, ActionData } from './$types';

  let { data, form } = $props<{ data: PageData; form: ActionData }>();

  const user = data.currentUser;

  let name = $state(user.name);
  let username = $state(user.username);
  let email = $state(user.email);
  let bio = $state(user.bio ?? '');
  let avatarPreview = $state('');
  let removeAvatar = $state(false);
  let selectedFile = $state<File | null>(null);
  let fileInput = $state<HTMLInputElement | null>(null);
  let errorMessage = $state(form?.error ?? '');
  let isSubmitting = $state(false);

  async function handleFileChange(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file) return;
    errorMessage = '';
    try {
      const resized = await resizeImageForUpload(file);
      selectedFile = resized;
      removeAvatar = false;
      const reader = new FileReader();
      reader.readAsDataURL(resized);
      reader.onload = () => { avatarPreview = reader.result as string; };
    } catch (e) {
      errorMessage = e instanceof Error ? e.message : 'Could not prepare avatar.';
    }
  }

  function handleRemoveAvatar() {
    selectedFile = null;
    avatarPreview = '';
    removeAvatar = true;
  }

  const currentAvatar = $derived(avatarPreview || (!removeAvatar ? imageUrl(user.avatar) : '/assets/placeholder.svg'));
</script>

<div class="rounded-2xl border border-slate-200 bg-white text-slate-950 dark:border-white/10 dark:bg-slate-950 dark:text-white mx-auto flex max-w-xl flex-col gap-6 p-6 shadow-lg shadow-slate-900/5 sm:px-8">
  <div class="flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-white/10">
    <a href="/settings" class="btn btn-ghost btn-circle btn-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white" title="Back to Settings">
      <ArrowLeft class="h-5 w-5" />
    </a>
    <h1 class="text-2xl font-black text-slate-950 dark:text-white">Edit Profile</h1>
  </div>

  {#if errorMessage}
    <div class="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm font-semibold text-error">
      {errorMessage}
    </div>
  {/if}

  {#if form?.error}
    <div class="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm font-semibold text-error">
      {form.error}
    </div>
  {/if}

  <form
    method="POST"
    enctype="multipart/form-data"
    class="grid gap-6"
    use:enhance={({ formData }) => {
      isSubmitting = true;
      errorMessage = '';
      formData.delete('avatar');
      if (selectedFile) formData.set('avatar', selectedFile, selectedFile.name);
      formData.set('removeAvatar', String(removeAvatar));
      return async ({ result, update }) => {
        isSubmitting = false;
        if (result.type === 'failure') {
          errorMessage = (result.data as { error?: string })?.error ?? 'Could not save profile.';
        }
        await update();
      };
    }}
  >
    <!-- Avatar -->
    <div class="flex flex-col items-center gap-3">
      <div class="relative">
        <label
          for="avatar-input"
          class="group relative block cursor-pointer overflow-hidden rounded-full border border-slate-200 dark:border-white/15 shadow-md h-24 w-24 sm:h-28 sm:w-28 transition-transform hover:scale-[1.02]"
          title="Change Avatar"
        >
          <img class="h-full w-full object-cover" src={currentAvatar} alt="Profile avatar" />
          <div class="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 text-white opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
            <Camera class="h-6 w-6" />
            <span class="mt-1 text-[10px] font-bold uppercase tracking-wider">Change</span>
          </div>
        </label>

        {#if avatarPreview || (user.avatar && !removeAvatar)}
          <div class="absolute bottom-0 right-0 rounded-full bg-white dark:bg-slate-950 shadow-sm">
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all duration-150 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95 dark:border-white/15 dark:text-slate-500 dark:hover:border-rose-900/50 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
              title="Remove avatar"
              onclick={handleRemoveAvatar}
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        {/if}
      </div>
      <span class="text-xs font-medium text-slate-500 dark:text-slate-400">Tap image to change</span>
    </div>

    <!-- Hidden file input (not submitted — we inject manually via enhance) -->
    <input
      bind:this={fileInput}
      type="file"
      id="avatar-input"
      name="avatar"
      accept="image/*"
      class="hidden"
      onchange={(e) => handleFileChange(e.currentTarget.files)}
    />

    <input type="hidden" name="removeAvatar" value={String(removeAvatar)} />

    <div class="grid gap-4">
      <div class="form-control grid gap-2">
        <label for="name" class="label p-0">
          <span class="label-text text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Full Name</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          bind:value={name}
          placeholder="Enter your name"
          autocomplete="name"
          required
          class="input input-bordered w-full rounded-xl border-slate-300 bg-white text-slate-950 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none dark:border-white/15 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white/30"
        />
      </div>

      <div class="form-control grid gap-2">
        <label for="username" class="label p-0">
          <span class="label-text text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Username</span>
        </label>
        <input
          type="text"
          id="username"
          name="username"
          bind:value={username}
          placeholder="Enter username"
          autocomplete="username"
          minlength="3"
          maxlength="30"
          required
          class="input input-bordered w-full rounded-xl border-slate-300 bg-white text-slate-950 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none dark:border-white/15 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white/30"
        />
      </div>

      <div class="form-control grid gap-2">
        <label for="email" class="label p-0">
          <span class="label-text text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Email Address</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          bind:value={email}
          placeholder="Enter email"
          autocomplete="email"
          required
          class="input input-bordered w-full rounded-xl border-slate-300 bg-white text-slate-950 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none dark:border-white/15 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white/30"
        />
      </div>

      <div class="form-control grid gap-2">
        <label for="bio" class="label p-0">
          <span class="label-text text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Bio</span>
        </label>
        <textarea
          id="bio"
          name="bio"
          bind:value={bio}
          placeholder="Tell people about yourself..."
          maxlength="300"
          autocomplete="off"
          class="textarea textarea-bordered h-24 w-full resize-none rounded-xl border-slate-300 bg-white text-slate-950 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none dark:border-white/15 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white/30"
        ></textarea>
      </div>
    </div>

    <button
      type="submit"
      disabled={isSubmitting}
      class="btn h-12 min-h-12 w-full rounded-full border-0 bg-slate-950 text-base font-extrabold text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
    >
      {isSubmitting ? 'Saving Profile...' : 'Save Profile Details'}
    </button>
  </form>
</div>
