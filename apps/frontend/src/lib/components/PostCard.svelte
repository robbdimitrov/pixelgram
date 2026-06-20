<script lang="ts">
  import { enhance } from '$app/forms';
  import { Heart, MessageCircle, Trash2, Send } from '@lucide/svelte';
  import { imageUrl } from '$lib/utils/imageUrl';
  import { relativeDate } from '$lib/utils/relativeDate';
  import { pluralize } from '$lib/utils/pluralize';
  import { fetchJson } from '$lib/utils/clientFetch';
  import type { Post, Comment } from '$lib/types';

  let {
    post: initialPost,
    currentUserId,
    singleView = false,
    comments: initialComments = [],
    nextCommentsCursor: initialNextCommentsCursor = null
  }: {
    post: Post;
    currentUserId: number;
    singleView?: boolean;
    comments?: Comment[];
    nextCommentsCursor?: string | null;
  } = $props();

  let liked = $state(initialPost.liked);
  let likes = $state(initialPost.likes);
  let comments = $state(initialComments);
  let commentCount = $state(initialPost.comments);
  let nextCommentsCursor = $state(initialNextCommentsCursor);
  let newCommentBody = $state('');
  let isSubmittingComment = $state(false);
  let isLoadingMoreComments = $state(false);
  let showDeleteModal = $state(false);
  let likeAnimating = $state(false);

  function playLikeAnimation() {
    likeAnimating = false;
    requestAnimationFrame(() => {
      likeAnimating = true;
      setTimeout(() => { likeAnimating = false; }, 220);
    });
  }

  async function loadMoreComments() {
    if (!nextCommentsCursor || isLoadingMoreComments) return;
    isLoadingMoreComments = true;
    try {
      const res = await fetch(`/posts/${initialPost.publicId}/comments?cursor=${encodeURIComponent(nextCommentsCursor)}`);
      const data = await fetchJson<{ items: Comment[]; nextCursor: string | null }>(res);
      comments = [...comments, ...data.items];
      nextCommentsCursor = data.nextCursor;
    } finally {
      isLoadingMoreComments = false;
    }
  }
</script>

<div class="w-full overflow-hidden shadow-lg shadow-slate-900/5 transition-colors rounded-2xl border border-slate-200 bg-white text-slate-950 dark:border-white/10 dark:bg-slate-950 dark:text-white">
  <!-- Header: avatar + username + delete button -->
  <div class="relative flex items-center border-b border-slate-200 bg-slate-50/80 px-6 py-4 pr-16 dark:border-white/10 dark:bg-white/5 sm:pr-20">
    <div class="flex items-center gap-3">
      <a href="/@{initialPost.username}" class="relative shrink-0 overflow-hidden rounded-full border border-slate-200 dark:border-white/15 h-11 w-11 transition-colors hover:border-slate-950 dark:hover:border-white">
        <img class="h-full w-full object-cover" src={imageUrl(initialPost.avatar)} alt={initialPost.username} loading="lazy" decoding="async" />
      </a>
      <div class="flex flex-col">
        <a href="/@{initialPost.username}" class="text-base font-bold leading-6 text-slate-950 transition-colors hover:text-primary dark:text-white">
          {initialPost.username}
        </a>
        {#if initialPost.name}
          <span class="text-sm leading-5 text-slate-500 dark:text-slate-400">{initialPost.name}</span>
        {/if}
      </div>
    </div>

    {#if currentUserId === initialPost.userId}
      <button
        type="button"
        class="absolute right-5 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-all duration-150 hover:bg-rose-500/10 hover:text-rose-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 dark:text-slate-500 dark:hover:text-rose-400 sm:right-6"
        title="Delete post"
        aria-label="Delete post"
        onclick={() => (showDeleteModal = true)}
      >
        <Trash2 class="h-5 w-5" />
      </button>
    {/if}
  </div>

  <!-- Image -->
  <div class="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
    <img
      class="h-full w-full cursor-pointer object-cover transition-transform duration-700 hover:scale-[1.03]"
      src={imageUrl(initialPost.filename)}
      alt={initialPost.description ?? ''}
      loading="lazy"
      decoding="async"
      width="600"
      height="600"
    />
  </div>

  <!-- Actions + meta -->
  <div class="flex flex-col gap-4 p-6">
    <div class="flex items-center gap-5">
      <!-- Like form (mini-form → named action on single post page) -->
      <form
        method="POST"
        action="/posts/{initialPost.publicId}?/{liked ? 'unlike' : 'like'}"
        use:enhance={() => {
          const prevLiked = liked;
          const prevLikes = likes;
          liked = !liked;
          likes += liked ? 1 : -1;
          if (liked) playLikeAnimation();
          return async ({ result }) => {
            if (result.type === 'error' || result.type === 'failure') {
              liked = prevLiked;
              likes = prevLikes;
            }
          };
        }}
      >
        <button
          type="submit"
          class="group inline-flex items-center gap-1.5 text-sm font-semibold transition-colors active:scale-95 {liked ? 'text-rose-500 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}"
          aria-label={liked ? 'Unlike post' : 'Like post'}
          aria-pressed={liked}
        >
          <Heart
            class="h-5 w-5 transition-all duration-150 ease-out {likeAnimating ? 'animate-like-pop' : ''} {liked ? 'fill-rose-500 dark:fill-rose-400' : 'fill-transparent'}"
          />
          <span class={likeAnimating ? 'animate-like-pop' : ''}>
            {likes} {pluralize(likes, 'like')}
          </span>
        </button>
      </form>

      <a
        href="/posts/{initialPost.publicId}"
        class="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
        aria-label="View comments"
      >
        <MessageCircle class="h-5 w-5" />
        {commentCount} {pluralize(commentCount, 'comment')}
      </a>
    </div>

    {#if initialPost.description && initialPost.description.length > 0}
      <div class="text-base leading-7">
        <a href="/@{initialPost.username}" class="mr-1.5 font-bold text-slate-950 hover:underline dark:text-white">
          {initialPost.username}
        </a>
        <span class="whitespace-pre-wrap text-slate-700 dark:text-slate-300">{initialPost.description}</span>
      </div>
    {/if}

    <span class="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-500 dark:text-slate-400">
      {relativeDate(initialPost.created, 'long')}
    </span>

    {#if singleView}
      <div class="border-t border-slate-100 pt-4 dark:border-white/10">
        <!-- Comment form -->
        <div class="flex flex-col gap-4">
          <form
            method="POST"
            action="/posts/{initialPost.publicId}?/comment"
            class="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-white/10"
            use:enhance={() => {
              isSubmittingComment = true;
              return async ({ result }) => {
                isSubmittingComment = false;
                if (result.type === 'success' && result.data?.comment) {
                  comments = [...comments, result.data.comment as Comment];
                  commentCount += 1;
                  newCommentBody = '';
                }
              };
            }}
          >
            <input
              type="text"
              name="body"
              bind:value={newCommentBody}
              class="min-w-0 flex-1 bg-transparent text-sm text-slate-950 placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-slate-500"
              placeholder="Add a comment…"
              maxlength="400"
              autocomplete="off"
            />
            <button
              type="submit"
              class="shrink-0 text-primary transition-opacity disabled:opacity-40"
              disabled={!newCommentBody.trim() || isSubmittingComment}
              aria-label="Post comment"
            >
              {#if isSubmittingComment}
                <span class="loading loading-spinner loading-xs"></span>
              {:else}
                <Send class="h-5 w-5" />
              {/if}
            </button>
          </form>

          <!-- Comments list -->
          {#each comments as comment (comment.id)}
            <div class="group flex items-start gap-3">
              <a href="/@{comment.username}" class="relative shrink-0 overflow-hidden rounded-full border border-slate-200 dark:border-white/15 h-8 w-8 mt-0.5 transition-colors hover:border-slate-950 dark:hover:border-white">
                <img class="h-full w-full object-cover" src={imageUrl(comment.avatar)} alt={comment.username} loading="lazy" decoding="async" />
              </a>
              <div class="min-w-0 flex-1 text-sm leading-6">
                <a href="/@{comment.username}" class="mr-1.5 font-bold text-slate-950 hover:underline dark:text-white">{comment.username}</a>
                <span class="break-words whitespace-pre-wrap text-slate-700 dark:text-slate-300">{comment.body}</span>
                <div class="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{relativeDate(comment.created)}</div>
              </div>
              {#if currentUserId === comment.userId}
                <form
                  method="POST"
                  action="/posts/{initialPost.publicId}?/deleteComment"
                  use:enhance={() => {
                    const idx = comments.findIndex((c: Comment) => c.id === comment.id);
                    comments = comments.filter((c: Comment) => c.id !== comment.id);
                    commentCount = Math.max(0, commentCount - 1);
                    return async ({ result }) => {
                      if (result.type === 'error' || result.type === 'failure') {
                        const restored = [...comments];
                        restored.splice(idx, 0, comment);
                        comments = restored;
                        commentCount += 1;
                      }
                    };
                  }}
                >
                  <input type="hidden" name="commentId" value={comment.id} />
                  <button
                    type="submit"
                    class="-mr-2 mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-all duration-150 hover:bg-rose-500/10 hover:text-rose-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 dark:text-slate-500 dark:hover:text-rose-400"
                    aria-label="Delete comment"
                    title="Delete comment"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </form>
              {/if}
            </div>
          {/each}

          {#if nextCommentsCursor}
            <button
              type="button"
              class="self-start text-sm font-semibold text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
              disabled={isLoadingMoreComments}
              onclick={loadMoreComments}
            >
              {#if isLoadingMoreComments}
                <span class="loading loading-spinner loading-xs"></span>
              {:else}
                Load more comments
              {/if}
            </button>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Delete post modal -->
{#if showDeleteModal}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px]"
    role="presentation"
    onclick={() => (showDeleteModal = false)}
    onkeydown={(e) => e.key === 'Escape' && (showDeleteModal = false)}
  >
    <div
      class="w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-slate-950 dark:text-white"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <div class="grid gap-3">
        <h3 id="delete-modal-title" class="text-xl font-black">Delete post?</h3>
        <p class="text-sm leading-6 text-slate-600 dark:text-slate-300">
          This will permanently remove this photo from your profile and feed.
        </p>
      </div>
      <div class="mt-6 flex justify-end gap-3">
        <button
          type="button"
          class="btn h-11 min-h-11 rounded-full px-5 font-bold"
          onclick={() => (showDeleteModal = false)}
        >
          Cancel
        </button>
        <form method="POST" action="/posts/{initialPost.publicId}?/deletePost" use:enhance>
          <button
            type="submit"
            class="btn btn-error h-11 min-h-11 rounded-full px-5 font-bold text-white"
          >
            Delete
          </button>
        </form>
      </div>
    </div>
  </div>
{/if}
