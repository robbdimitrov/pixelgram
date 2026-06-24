<script lang="ts">
	import { resolve } from '$app/paths';
	import { Bell, Camera, Heart, TriangleAlert, SquarePlus } from '@lucide/svelte';

	type Icon = 'bell' | 'camera' | 'heart' | 'square-plus' | 'triangle-alert';
	type ButtonStyle = 'primary' | 'outline';
	type InternalPath = `/${string}`;

	let {
		icon = 'camera',
		title,
		description,
		actionLabel = '',
		actionRoute,
		actionStyle = 'primary'
	}: {
		icon?: Icon;
		title: string;
		description: string;
		actionLabel?: string;
		actionRoute?: InternalPath;
		actionStyle?: ButtonStyle;
	} = $props();
</script>

<div
	class="flex w-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-base-300 bg-base-100 p-6 text-center text-base-content shadow-lg shadow-slate-900/5 sm:px-8"
>
	<div class="grid h-14 w-14 place-items-center rounded-full bg-neutral text-neutral-content">
		{#if icon === 'camera'}
			<Camera class="h-6 w-6" />
		{:else if icon === 'heart'}
			<Heart class="h-6 w-6" />
		{:else if icon === 'triangle-alert'}
			<TriangleAlert class="h-6 w-6" />
		{:else if icon === 'bell'}
			<Bell class="h-6 w-6" />
		{:else}
			<SquarePlus class="h-6 w-6" />
		{/if}
	</div>
	<h2 class="text-2xl font-black">{title}</h2>
	<p class="max-w-sm text-sm leading-6 text-base-content/70">{description}</p>
	{#if actionLabel && actionRoute}
		<a
			href={resolve(actionRoute)}
			class="btn h-12 min-h-12 rounded-full px-6 font-bold transition-all duration-150 active:scale-95 {actionStyle ===
			'primary'
				? 'btn-neutral shadow-lg'
				: 'btn-outline'}"
		>
			{actionLabel}
		</a>
	{/if}
</div>
