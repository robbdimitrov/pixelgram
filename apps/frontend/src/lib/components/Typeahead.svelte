<script lang="ts">
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

  function select(item: unknown) {
    onselect(display(item));
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      select(items[activeIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onselect('');
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if items.length > 0}
  <ul class="menu menu-sm dropdown-content z-10 mt-1 w-52 rounded-box bg-base-100 p-1 shadow-lg shadow-slate-900/10 border border-base-300">
    {#each items as item, i (display(item))}
      <li>
        <button
          type="button"
          class={i === activeIndex ? 'active' : ''}
          onmouseenter={() => { activeIndex = i; }}
          onclick={() => select(item)}
        >
          {display(item)}
        </button>
      </li>
    {/each}
  </ul>
{/if}
