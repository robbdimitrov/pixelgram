<script lang="ts">
  let { children } = $props<{ children: import('svelte').Snippet }>();
</script>

<div class="flex min-h-screen items-center justify-center bg-base-200 p-4">
  {@render children()}
</div>
