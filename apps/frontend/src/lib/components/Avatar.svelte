<script lang="ts">
	import { imageUrl } from '$lib/utils/imageUrl';

	let {
		username,
		avatar,
		size = 'h-11 w-11',
		class: extra = ''
	}: {
		username: string;
		avatar: string | null;
		size?: string;
		class?: string;
	} = $props();
</script>

<a
	href="/@{username}"
	class="relative block shrink-0 overflow-hidden rounded-full border border-base-300 transition-colors hover:border-base-content {size} {extra}"
>
	<img
		class="h-full w-full object-cover"
		src={imageUrl(avatar)}
		alt={username}
		loading="lazy"
		decoding="async"
	/>
</a>
