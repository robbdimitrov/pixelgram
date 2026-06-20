<script lang="ts">
	import '../app.css';
	import type { LayoutData } from './$types';

	let { children } = $props<{ data: LayoutData; children: import('svelte').Snippet }>();
</script>

{@render children()}
