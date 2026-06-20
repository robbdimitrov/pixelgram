<script lang="ts">
  import { Camera, Heart, TriangleAlert, SquarePlus } from '@lucide/svelte';

  type Icon = 'camera' | 'heart' | 'square-plus' | 'triangle-alert';
  type ButtonStyle = 'primary' | 'outline';

  let {
    icon = 'camera',
    title,
    description,
    actionLabel = '',
    actionRoute = '',
    actionStyle = 'primary'
  } = $props<{
    icon?: Icon;
    title: string;
    description: string;
    actionLabel?: string;
    actionRoute?: string;
    actionStyle?: ButtonStyle;
  }>();
</script>

<div class="flex w-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-950 shadow-lg shadow-slate-900/5 dark:border-white/15 dark:bg-slate-950 dark:text-white sm:px-8">
  <div class="grid h-14 w-14 place-items-center rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950">
    {#if icon === 'camera'}
      <Camera class="h-6 w-6" />
    {:else if icon === 'heart'}
      <Heart class="h-6 w-6" />
    {:else if icon === 'triangle-alert'}
      <TriangleAlert class="h-6 w-6" />
    {:else}
      <SquarePlus class="h-6 w-6" />
    {/if}
  </div>
  <h2 class="text-2xl font-black">{title}</h2>
  <p class="max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
  {#if actionLabel && actionRoute}
    <a
      href={actionRoute}
      class="btn inline-flex h-12 min-h-12 items-center justify-center rounded-full px-6 font-bold leading-none transition-all duration-150 active:scale-95"
      class:border-0={actionStyle === 'primary'}
      class:bg-slate-950={actionStyle === 'primary'}
      class:text-white={actionStyle === 'primary'}
      class:shadow-lg={actionStyle === 'primary'}
      class:hover:bg-slate-800={actionStyle === 'primary'}
      class:dark:bg-white={actionStyle === 'primary'}
      class:dark:text-slate-950={actionStyle === 'primary'}
      class:dark:hover:bg-slate-200={actionStyle === 'primary'}
      class:border={actionStyle === 'outline'}
      class:border-slate-300={actionStyle === 'outline'}
      class:bg-transparent={actionStyle === 'outline'}
      class:text-slate-900={actionStyle === 'outline'}
    >
      {actionLabel}
    </a>
  {/if}
</div>
