<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { createPagination } from '$lib/createPagination.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import LoadMoreButton from '$lib/components/LoadMoreButton.svelte';
	import Thumbnail from '$lib/components/Thumbnail.svelte';
	import { fetchJson } from '$lib/utils/clientFetch';
	import type { PageData } from './$types';
	import type { SearchItem, SearchType } from '$lib/server/api/search';
	import { Hash, FileText, Users } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	const TABS: { label: string; value: SearchType }[] = [
		{ label: 'Posts', value: 'posts' },
		{ label: 'Users', value: 'users' },
		{ label: 'Hashtags', value: 'hashtags' }
	];

	function buildUrl(q: string, type: SearchType): string {
		const params = new URLSearchParams({ q, type });
		return `/search?${params.toString()}`;
	}

	function navigate(q: string, type: SearchType) {
		goto(resolve(buildUrl(q, type) as any), { replaceState: true });
	}

	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	function onInput(e: Event) {
		const value = (e.currentTarget as HTMLInputElement).value;
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			const resolvedType = value.startsWith('@')
				? 'users'
				: value.startsWith('#')
					? 'hashtags'
					: data.type;
			navigate(value, resolvedType);
		}, 300);
	}

	function onTabClick(type: SearchType) {
		navigate(data.q, type);
	}

	const pagination = createPagination(
		() => ({ items: data.items, nextCursor: data.nextCursor }),
		async (cursor) => {
			const params = new URLSearchParams({ q: data.q, type: data.type, cursor });
			const res = await fetch(`/search?${params.toString()}`);
			return fetchJson<{ items: SearchItem[]; nextCursor: string | null }>(res);
		}
	);
</script>

<svelte:head>
	<title>{data.q ? `"${data.q}" — Search` : 'Search'} — Phasma</title>
</svelte:head>

<div class="mx-auto flex max-w-xl flex-col gap-6">
	<div class="relative w-full">
		<input
			type="search"
			class="input input-bordered w-full rounded-full pl-4 pr-10"
			placeholder="Search users, posts, hashtags…"
			value={data.q}
			oninput={onInput}
			aria-label="Search"
		/>
	</div>

	{#if !data.q}
		{#if data.suggested.length > 0}
			<div class="flex flex-col gap-3">
				<h2 class="text-sm font-bold text-base-content/60 uppercase tracking-wide">
					People to follow
				</h2>
				<div class="flex flex-col gap-2">
					{#each data.suggested as user (user.id)}
						<div class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-3">
							<Avatar username={user.username} avatar={user.avatar} size="h-10 w-10" />
							<a href={resolve(`/@${user.username}`)} class="min-w-0 flex-1">
								<p class="truncate font-bold">{user.name || user.username}</p>
								<p class="truncate text-sm text-base-content/60">@{user.username}</p>
							</a>
							<form method="POST" action="?/{user.isFollowing ? 'unfollow' : 'follow'}" use:enhance>
								<input type="hidden" name="userId" value={user.id} />
								<button
									type="submit"
									class="btn btn-sm h-9 min-h-9 shrink-0 rounded-full px-4 text-xs font-extrabold {user.isFollowing
										? 'btn-outline'
										: 'btn-neutral'}"
								>
									{user.isFollowing ? 'Unfollow' : 'Follow'}
								</button>
							</form>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if data.popular.length > 0}
			<div class="flex flex-col gap-3">
				<h2 class="text-sm font-bold text-base-content/60 uppercase tracking-wide">
					Popular posts
				</h2>
				<div class="grid grid-cols-3 gap-2">
					{#each data.popular as post (post.id)}
						<Thumbnail {post} />
					{/each}
				</div>
			</div>
		{/if}

		{#if data.suggested.length === 0 && data.popular.length === 0}
			<div class="flex flex-col items-center gap-3 py-12 text-base-content/40">
				<Users class="h-12 w-12" />
				<p class="text-sm">Search for users, posts, or hashtags</p>
			</div>
		{/if}
	{:else}
		<div role="tablist" class="tabs tabs-bordered justify-center font-bold">
			{#each TABS as tab (tab.value)}
				<button
					role="tab"
					class="tab"
					class:tab-active={data.type === tab.value}
					onclick={() => onTabClick(tab.value)}
					aria-selected={data.type === tab.value}
				>
					{tab.label}
				</button>
			{/each}
		</div>

		{#if pagination.items.length === 0}
			<EmptyState
				icon="triangle-alert"
				title="No results"
				description="Nothing matched &ldquo;{data.q}&rdquo;. Try a different query."
			/>
		{:else if data.type === 'users'}
			<ul class="flex flex-col gap-2">
				{#each pagination.items as item (item.id)}
					{@const user = item as import('$lib/server/api/search').SearchUserItem}
					<li>
						<a
							href={resolve(`/@${user.username}`)}
							class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 transition-colors hover:bg-base-200"
						>
							<Avatar username={user.username} avatar={null} size="h-10 w-10" />
							<div class="min-w-0">
								<p class="truncate font-bold">{user.name}</p>
								<p class="truncate text-sm text-base-content/60">@{user.username}</p>
							</div>
						</a>
					</li>
				{/each}
			</ul>
		{:else if data.type === 'posts'}
			<ul class="flex flex-col gap-2">
				{#each pagination.items as item (item.id)}
					{@const post = item as import('$lib/server/api/search').SearchPostItem}
					<li>
						<a
							href={resolve(`/posts/${post.id}`)}
							class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 transition-colors hover:bg-base-200"
						>
							<span
								class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-base-300 text-base-content/60"
							>
								<FileText class="h-5 w-5" />
							</span>
							<div class="min-w-0">
								<p class="truncate text-sm font-bold text-base-content/60">@{post.username}</p>
								{#if post.description}
									<p class="truncate text-sm text-base-content/80">{post.description}</p>
								{/if}
							</div>
						</a>
					</li>
				{/each}
			</ul>
		{:else}
			<ul class="flex flex-col gap-2">
				{#each pagination.items as item (item.id)}
					{@const hashtag = item as import('$lib/server/api/search').SearchHashtagItem}
					<li>
						<a
							href={resolve(`/search?q=%23${encodeURIComponent(hashtag.name)}&type=hashtags`)}
							class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 transition-colors hover:bg-base-200"
						>
							<span
								class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-base-300 text-base-content/60"
							>
								<Hash class="h-5 w-5" />
							</span>
							<div class="min-w-0">
								<p class="truncate font-bold">#{hashtag.name}</p>
								<p class="truncate text-sm text-base-content/60">{hashtag.post_count} posts</p>
							</div>
						</a>
					</li>
				{/each}
			</ul>
		{/if}

		{#if !pagination.done && pagination.items.length > 0}
			<div class="flex flex-col items-center gap-2">
				{#if pagination.error}
					<p class="text-sm text-error">{pagination.error}</p>
				{/if}
				<LoadMoreButton loading={pagination.loading} onclick={pagination.more} />
			</div>
		{/if}
	{/if}
</div>
