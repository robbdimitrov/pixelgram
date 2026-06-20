<script lang="ts">
	import '../app.css';
	import { navigating } from '$app/stores';
	import type { LayoutData } from './$types';

	let { children } = $props<{ data: LayoutData; children: import('svelte').Snippet }>();
</script>

{#if $navigating}
  <div class="fixed inset-x-0 top-0 z-50 h-0.5 bg-primary/20">
    <div class="h-full w-1/3 animate-pulse rounded-full bg-primary"></div>
  </div>
{/if}

{@render children()}
