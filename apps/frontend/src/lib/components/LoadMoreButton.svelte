<script lang="ts">
	let { loading, onclick }: { loading: boolean; onclick: () => void } = $props();
</script>

<button
	class="btn btn-outline btn-primary rounded-xl px-8 font-bold transition-transform hover:scale-105 active:scale-95"
	{onclick}
	disabled={loading}
>
	{#if loading}
		<span class="loading loading-spinner"></span>
	{:else}
		Load More
	{/if}
</button>
