<script lang="ts">
  import PostCard from '$lib/components/PostCard.svelte';
  import type { PageData } from './$types';

  let { data } = $props<{ data: PageData }>();
</script>

<div class="mx-auto max-w-xl">
  <PostCard
    post={data.post}
    currentUserId={data.currentUser.id}
    singleView={true}
    comments={data.comments}
    nextCommentsCursor={data.nextCommentsCursor}
  />
</div>
