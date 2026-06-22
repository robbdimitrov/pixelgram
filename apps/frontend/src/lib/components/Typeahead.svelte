<script lang="ts">
	import { typeaheadNav } from '$lib/utils/typeaheadNav';

	let {
		onselect,
		items,
		display
	}: {
		onselect: (value: string) => void;
		items: unknown[];
		display: (item: unknown) => string;
	} = $props();

	let activeIndex = $state(0);

	// Reset active index when items list changes.
	$effect(() => {
		if (items) activeIndex = 0;
	});

	function handleKeydown(e: KeyboardEvent) {
		const { index, action } = typeaheadNav(e.key, activeIndex, items.length);
		if (action === 'none' && index === activeIndex) return;
		e.preventDefault();
		activeIndex = index;
		if (action === 'select') onselect(display(items[index]));
		else if (action === 'clear') onselect('');
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if items.length > 0}
	<ul
		class="menu menu-sm dropdown-content z-10 mt-1 w-52 rounded-box bg-base-100 p-1 shadow-lg shadow-slate-900/10 border border-base-300"
	>
		{#each items as item, i (display(item))}
			<li>
				<button
					type="button"
					class={i === activeIndex ? 'active' : ''}
					onmouseenter={() => {
						activeIndex = i;
					}}
					onclick={() => onselect(display(item))}
				>
					{display(item)}
				</button>
			</li>
		{/each}
	</ul>
{/if}
