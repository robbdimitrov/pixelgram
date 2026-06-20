<script lang="ts">
  import { Heart } from '@lucide/svelte';
  import { imageUrl } from '$lib/utils/imageUrl';
  import type { Post } from '$lib/types';

  let { post } = $props<{ post: Post }>();
</script>

<a
  href="/posts/{post.publicId}"
  class="group relative block aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-base-300/30 shadow-sm transition-all duration-500 hover:shadow-md"
>
  <img
    class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
    src={imageUrl(post.filename)}
    alt={post.description ?? ''}
    loading="lazy"
    width="300"
    height="300"
  />
  <div class="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 text-sm font-extrabold text-white opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
    <Heart class="h-4 w-4 fill-current text-white" />
    <span>{post.likes}</span>
  </div>
</a>
