<script lang="ts">
  import { enhance } from '$app/forms';
  import { SquarePlus } from '@lucide/svelte';
  import { resizeImageForUpload, supportedUploadMimeTypes } from '$lib/utils/image-resizer';
  import type { ActionData } from './$types';

  const MAX_DESCRIPTION = 1000;

  let { form } = $props<{ form: ActionData }>();

  let imagePreview = $state('');
  let errorMessage = $state(form?.error ?? '');
  let isSubmitting = $state(false);
  let isDragging = $state(false);
  let description = $state('');
  let selectedFile = $state<File | undefined>(undefined);
  let fileInput = $state<HTMLInputElement | null>(null);

  async function selectFile(file: File | null | undefined) {
    errorMessage = '';
    if (!file) return;
    try {
      const resized = await resizeImageForUpload(file);
      selectedFile = resized;
      const reader = new FileReader();
      reader.readAsDataURL(resized);
      reader.onload = () => { imagePreview = reader.result as string; };
    } catch (e) {
      selectedFile = undefined;
      imagePreview = '';
      errorMessage = e instanceof Error ? e.message : 'Could not prepare image.';
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    selectFile(e.dataTransfer?.files.item(0));
  }
</script>

<div class="mx-auto max-w-5xl">
  <div class="rounded-2xl border border-slate-200 bg-white text-slate-950 dark:border-white/10 dark:bg-slate-950 dark:text-white overflow-hidden shadow-xl shadow-slate-900/5">
    <div class="flex min-h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-white/10 sm:px-8">
      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">PixelGram</p>
        <h1 class="text-lg font-black leading-tight">Create new post</h1>
      </div>
      <button
        type="submit"
        form="upload-form"
        disabled={!selectedFile || isSubmitting}
        class="btn btn-sm inline-flex min-h-10 items-center justify-center rounded-full border-0 bg-slate-950 px-5 font-black leading-none text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 dark:disabled:bg-white/10 dark:disabled:text-slate-600"
      >
        {isSubmitting ? 'Sharing...' : 'Share'}
      </button>
    </div>

    <form
      id="upload-form"
      method="POST"
      enctype="multipart/form-data"
      use:enhance={({ formData }) => {
        isSubmitting = true;
        errorMessage = '';
        // Replace file input with the already-resized file
        formData.delete('image');
        if (selectedFile) formData.set('image', selectedFile, selectedFile.name);
        return async ({ result, update }) => {
          isSubmitting = false;
          if (result.type === 'failure') {
            errorMessage = (result.data as { error?: string })?.error ?? 'Could not share post.';
          }
          await update();
        };
      }}
    >
      <div class="grid min-h-[34rem] md:grid-cols-[minmax(0,1fr)_22rem]">
        <!-- Left: image drop zone / preview -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class={[
            'flex min-h-96 items-center justify-center bg-slate-50 p-6 transition-colors dark:bg-slate-900 sm:px-8',
            isDragging && 'bg-slate-100 dark:bg-white/10'
          ].filter(Boolean).join(' ')}
          ondragover={handleDragOver}
          ondragleave={handleDragLeave}
          ondrop={handleDrop}
        >
          {#if imagePreview}
            <div class="flex w-full max-w-[42rem] flex-col gap-4">
              <div class="aspect-square w-full overflow-hidden rounded-xl bg-slate-100 shadow-sm dark:bg-slate-900">
                <img class="h-full w-full object-cover" src={imagePreview} alt="Upload preview" />
              </div>
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-sm text-slate-500 dark:text-slate-400">This is how your photo will appear in the feed.</p>
                <button
                  type="button"
                  class="btn btn-sm inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white px-5 font-black leading-none text-slate-950 shadow-sm hover:border-slate-400 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:border-white/30 dark:hover:bg-white/10"
                  onclick={() => fileInput?.click()}
                >
                  Change photo
                </button>
              </div>
            </div>
          {:else}
            <label
              class="flex aspect-square w-full max-w-[42rem] cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 p-6 text-center transition-colors hover:border-slate-400 hover:bg-white/60 dark:border-white/15 dark:hover:border-white/30 dark:hover:bg-white/5 sm:px-8"
              for="file-input"
            >
              <span class="grid h-16 w-16 place-items-center rounded-full bg-slate-950 text-white shadow-md shadow-slate-900/15 dark:bg-white dark:text-slate-950">
                <SquarePlus class="h-7 w-7" />
              </span>
              <span class="text-2xl font-black leading-tight">Drop your photo here</span>
              <span class="max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-400">Choose a JPEG, PNG, GIF, or WEBP. Large images are resized automatically.</span>
              <span class="btn btn-sm inline-flex min-h-10 items-center justify-center rounded-full border-0 bg-slate-950 px-5 font-bold leading-none text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">Select from computer</span>
            </label>
          {/if}

          <input
            bind:this={fileInput}
            type="file"
            id="file-input"
            name="image"
            accept={supportedUploadMimeTypes.join(',')}
            class="hidden"
            onchange={(e) => selectFile(e.currentTarget.files?.item(0))}
          />
        </div>

        <!-- Right: caption + submit -->
        <div class="flex flex-col border-t border-slate-200 bg-slate-50/60 dark:border-white/10 dark:bg-slate-950 md:border-l md:border-t-0">
          <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4 dark:border-white/10 sm:px-8">
            <div class="grid gap-2">
              <span class="text-sm font-black">Caption</span>
              <p class="text-xs text-slate-500 dark:text-slate-400">Give your post a little context.</p>
            </div>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-white/10 dark:text-slate-400">{description.length}/{MAX_DESCRIPTION}</span>
          </div>

          <textarea
            name="description"
            bind:value={description}
            class="min-h-52 flex-1 resize-none border-0 bg-transparent px-6 py-5 text-base leading-7 text-slate-950 placeholder:text-slate-400 shadow-none outline-none focus:outline-none focus:ring-0 dark:text-white dark:placeholder:text-slate-500 sm:px-8"
            placeholder="Write a caption..."
            maxlength={MAX_DESCRIPTION}
            autocomplete="off"
          ></textarea>

          {#if errorMessage}
            <div class="mx-6 mb-6 rounded-2xl bg-error/10 px-4 py-3 text-sm font-bold text-error sm:mx-8">
              {errorMessage}
            </div>
          {/if}

          <div class="border-t border-slate-200 px-6 py-4 text-sm leading-6 text-slate-500 dark:border-white/10 dark:text-slate-400 sm:px-8">
            Your post will publish to the feed after the image upload completes.
          </div>
        </div>
      </div>
    </form>
  </div>
</div>
