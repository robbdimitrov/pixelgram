<script lang="ts">
  import PostCard from '$lib/components/PostCard.svelte';
  import type { PageData } from './$types';

  let { data } = $props<{ data: PageData }>();
</script>

<svelte:head>
  <title>{data.post.description ? data.post.description.slice(0, 60) : 'Post'} — PixelGram</title>
</svelte:head>

<div class="mx-auto max-w-xl">
  <PostCard
    post={data.post}
    currentUserId={data.currentUser.id}
    singleView={true}
    comments={data.comments}
    nextCommentsCursor={data.nextCommentsCursor}
  />
</div>
