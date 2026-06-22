<script lang="ts">
	import { linkify } from '$lib/utils/linkify';

	let { text }: { text: string } = $props();

	const tokens = $derived(linkify(text));
</script>

<span class="whitespace-pre-wrap"
	>{#each tokens as token (token)}{#if token.type === 'mention'}<a
				href={token.href}
				class="link link-primary">{token.value}</a
			>{:else if token.type === 'hashtag'}<a href={token.href} class="link link-secondary"
				>{token.value}</a
			>{:else if token.type === 'url'}<a
				href={token.href}
				target="_blank"
				rel="noopener noreferrer"
				class="link">{token.value}</a
			>{:else}<span>{token.value}</span>{/if}{/each}</span
>
