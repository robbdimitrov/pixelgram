<script lang="ts">
  import Navbar from '$lib/components/Navbar.svelte';
  import type { LayoutData } from './$types';

  let { data, children } = $props<{ data: LayoutData; children: import('svelte').Snippet }>();
</script>

<div class="min-h-screen bg-base-200">
  <div class="mx-auto max-w-5xl px-4 pb-8 pt-4">
    <Navbar currentUser={data.currentUser} />
    <main class="mt-6">
      {@render children()}
    </main>
  </div>
</div>
