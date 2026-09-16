'use client';

import {
	AlertCircle,
	ArrowRight,
	BarChart3,
	Bell,
	Check,
	CheckCircle2,
	ChevronDown,
	CircleDashed,
	Clock3,
	Command,
	Filter,
	Inbox,
	LayoutDashboard,
	LayoutList,
	Menu,
	MoreHorizontal,
	Plus,
	Search,
	Settings2,
	Sparkles,
	Target,
	Users,
	X,
	Zap
} from 'lucide-react';
import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	type FormEvent
} from 'react';
import type { LucideIcon } from 'lucide-react';

type ViewId = 'overview' | 'board' | 'backlog' | 'sprints';
type Status = 'Inbox' | 'Ready' | 'In progress' | 'Review' | 'Done';
type Priority = 'Urgent' | 'High' | 'Medium' | 'Low';

type Task = {
	id: string;
	title: string;
	status: Status;
	priority: Priority;
	points: number;
	assignee: string;
	initials: string;
	avatar: string;
	labels: string[];
	sprint: string | null;
	due: string;
	description: string;
};

const views: { id: ViewId; label: string; icon: LucideIcon }[] = [
	{ id: 'overview', label: 'Overview', icon: LayoutDashboard },
	{ id: 'board', label: 'Board', icon: LayoutList },
	{ id: 'backlog', label: 'Backlog', icon: Inbox },
	{ id: 'sprints', label: 'Sprints', icon: Zap }
];

const seedTasks: Task[] = [
	{
		id: 'CW-142',
		title: 'Create onboarding checklist for new students',
		status: 'In progress',
		priority: 'High',
		points: 5,
		assignee: 'Marina Costa',
		initials: 'MC',
		avatar: 'bg-violet-100 text-violet-700',
		labels: ['Product', 'Onboarding'],
		sprint: 'Sprint 12',
		due: 'Today',
		description:
			'Give new students a clear first-week path from account creation to their first mentor session.'
	},
	{
		id: 'CW-139',
		title: 'Add empty states to the project workspace',
		status: 'Review',
		priority: 'Medium',
		points: 3,
		assignee: 'Rafael Lima',
		initials: 'RL',
		avatar: 'bg-sky-100 text-sky-700',
		labels: ['UX', 'Workspace'],
		sprint: 'Sprint 12',
		due: 'Tomorrow',
		description:
			'Make empty and loading states useful instead of leaving the student guessing what to do next.'
	},
	{
		id: 'CW-136',
		title: 'Review mentorship booking edge cases',
		status: 'Ready',
		priority: 'Urgent',
		points: 8,
		assignee: 'João Santos',
		initials: 'JS',
		avatar: 'bg-amber-100 text-amber-700',
		labels: ['Mentorship', 'Bug'],
		sprint: 'Sprint 12',
		due: 'Thu, Apr 18',
		description:
			'Walk through rescheduling, timezone changes, and a mentor becoming unavailable mid-flow.'
	},
	{
		id: 'CW-131',
		title: 'Connect project activity to notifications',
		status: 'Done',
		priority: 'High',
		points: 5,
		assignee: 'Marina Costa',
		initials: 'MC',
		avatar: 'bg-violet-100 text-violet-700',
		labels: ['Platform'],
		sprint: 'Sprint 12',
		due: 'Apr 12',
		description:
			'Surface meaningful changes to the people who need to react, without turning the product noisy.'
	},
	{
		id: 'CW-128',
		title: 'Define project health score',
		status: 'Inbox',
		priority: 'Low',
		points: 2,
		assignee: 'Unassigned',
		initials: '?',
		avatar: 'bg-slate-100 text-slate-500',
		labels: ['Discovery'],
		sprint: null,
		due: 'No due date',
		description:
			'Explore a lightweight signal for mentors to spot projects that need attention before a student gets stuck.'
	},
	{
		id: 'CW-124',
		title: 'Polish sprint completion summary',
		status: 'Done',
		priority: 'Medium',
		points: 3,
		assignee: 'Rafael Lima',
		initials: 'RL',
		avatar: 'bg-sky-100 text-sky-700',
		labels: ['Sprints', 'UX'],
		sprint: 'Sprint 11',
		due: 'Apr 09',
		description:
			'Show what shipped, what returned to the backlog, and what the team learned at the end of a sprint.'
	},
	{
		id: 'CW-119',
		title: 'Add keyboard shortcuts to task navigation',
		status: 'Ready',
		priority: 'Low',
		points: 3,
		assignee: 'Camila Alves',
		initials: 'CA',
		avatar: 'bg-rose-100 text-rose-700',
		labels: ['Accessibility'],
		sprint: 'Sprint 13',
		due: 'Apr 22',
		description:
			'Let power users move through their work without leaving the keyboard.'
	},
	{
		id: 'CW-114',
		title: 'Document the project kickoff ritual',
		status: 'Inbox',
		priority: 'Medium',
		points: 1,
		assignee: 'Unassigned',
		initials: '?',
		avatar: 'bg-slate-100 text-slate-500',
		labels: ['Process'],
		sprint: null,
		due: 'No due date',
		description:
			'Turn the informal kickoff knowledge into a short, repeatable ritual for every new project.'
	}
];

const sprints = [
	{
		name: 'Sprint 12',
		status: 'Active',
		dates: 'Apr 08 – Apr 19',
		goal: 'Make the first week feel guided, not overwhelming.',
		progress: 62,
		points: 26,
		completed: 4,
		total: 7,
		color: 'bg-indigo-500'
	},
	{
		name: 'Sprint 13',
		status: 'Planning',
		dates: 'Apr 22 – May 03',
		goal: 'Make daily project work faster for students and mentors.',
		progress: 0,
		points: 13,
		completed: 0,
		total: 0,
		color: 'bg-slate-300'
	},
	{
		name: 'Sprint 11',
		status: 'Completed',
		dates: 'Mar 25 – Apr 05',
		goal: 'Give mentors a reliable project pulse.',
		progress: 100,
		points: 21,
		completed: 8,
		total: 8,
		color: 'bg-emerald-500'
	}
] as const;

const statusStyle: Record<Status, { dot: string; soft: string }> = {
	Inbox: { dot: 'bg-slate-400', soft: 'bg-slate-100 text-slate-600' },
	Ready: { dot: 'bg-blue-500', soft: 'bg-blue-50 text-blue-700' },
	'In progress': { dot: 'bg-amber-500', soft: 'bg-amber-50 text-amber-700' },
	Review: { dot: 'bg-violet-500', soft: 'bg-violet-50 text-violet-700' },
	Done: { dot: 'bg-emerald-500', soft: 'bg-emerald-50 text-emerald-700' }
};

const priorityStyle: Record<Priority, string> = {
	Urgent: 'text-rose-600',
	High: 'text-orange-500',
	Medium: 'text-amber-500',
	Low: 'text-slate-400'
};

function Avatar({
	initials,
	className
}: { initials: string; className: string }) {
	return (
		<span
			className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-bold text-[9px] ${className}`}
		>
			{initials}
		</span>
	);
}

function AvatarStack() {
	return (
		<div className="-space-x-2 flex">
			{(
				[
					['MC', 'bg-violet-100 text-violet-700'],
					['RL', 'bg-sky-100 text-sky-700'],
					['JS', 'bg-amber-100 text-amber-700']
				] as const
			).map(([initials, className]) => (
				<Avatar
					key={initials}
					initials={initials}
					className={`${className} border-2 border-white`}
				/>
			))}
			<span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 font-bold text-[9px] text-slate-500">
				+4
			</span>
		</div>
	);
}

function ProjectSidebar({
	view,
	onViewChange,
	mobileOpen,
	onClose,
	backlogCount
}: {
	view: ViewId;
	onViewChange: (view: ViewId) => void;
	mobileOpen: boolean;
	onClose: () => void;
	backlogCount: number;
}) {
	return (
		<>
			{mobileOpen && (
				<button
					type="button"
					aria-label="Close navigation"
					onClick={onClose}
					className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
				/>
			)}
			<aside
				className={`${mobileOpen ? 'flex' : 'hidden'} fixed inset-y-0 left-0 z-50 w-[252px] flex-col bg-[#111827] text-white shadow-2xl lg:static lg:flex lg:shadow-none`}
			>
				<div className="flex h-[72px] items-center gap-3 border-slate-700/70 border-b px-6">
					<div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-indigo-500 font-black text-sm">
						C
					</div>
					<div>
						<p className="font-extrabold text-sm tracking-tight">CodeWise</p>
						<p className="mt-0.5 text-[9px] text-slate-400 uppercase tracking-[0.16em]">
							Workspace
						</p>
					</div>
				</div>
				<div className="p-4">
					<button
						type="button"
						className="flex w-full items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/60 p-3 text-left transition hover:border-slate-600 hover:bg-slate-800"
					>
						<span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 font-black text-indigo-300 text-xs">
							MP
						</span>
						<span className="min-w-0 flex-1">
							<span className="block truncate font-bold text-xs">
								Mentorship platform
							</span>
							<span className="mt-1 block text-[10px] text-slate-400">
								Personal workspace
							</span>
						</span>
						<ChevronDown className="h-4 w-4 text-slate-500" />
					</button>
				</div>
				<nav className="px-4" aria-label="Project navigation">
					<p className="mb-2 px-3 font-bold text-[9px] text-slate-500 uppercase tracking-[0.16em]">
						Project
					</p>
					<div className="space-y-1">
						{views.map((item) => {
							const Icon = item.icon;
							const active = item.id === view;
							return (
								<button
									key={item.id}
									type="button"
									onClick={() => {
										onViewChange(item.id);
										onClose();
									}}
									className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-semibold text-xs transition ${active ? 'bg-indigo-500 text-white shadow-indigo-950/20 shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
								>
									<Icon className="h-4 w-4" />
									{item.label}
									{item.id === 'backlog' && (
										<span className="ml-auto rounded-full bg-white/10 px-1.5 py-0.5 font-mono text-[9px] text-slate-300">
											{backlogCount}
										</span>
									)}
								</button>
							);
						})}
					</div>
					<p className="mt-8 mb-2 px-3 font-bold text-[9px] text-slate-500 uppercase tracking-[0.16em]">
						Manage
					</p>
					<div className="space-y-1">
						<button
							type="button"
							className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-semibold text-slate-400 text-xs hover:bg-slate-800 hover:text-white"
						>
							<BarChart3 className="h-4 w-4" />
							Reports
						</button>
						<button
							type="button"
							className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-semibold text-slate-400 text-xs hover:bg-slate-800 hover:text-white"
						>
							<Users className="h-4 w-4" />
							Members
							<span className="ml-auto text-[10px] text-slate-500">7</span>
						</button>
						<button
							type="button"
							className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-semibold text-slate-400 text-xs hover:bg-slate-800 hover:text-white"
						>
							<Settings2 className="h-4 w-4" />
							Settings
						</button>
					</div>
				</nav>
				<div className="mt-auto border-slate-700/70 border-t p-4">
					<div className="flex items-center gap-3 rounded-lg px-2 py-2">
						<Avatar initials="MC" className="bg-rose-200 text-rose-800" />
						<span className="min-w-0 flex-1">
							<span className="block truncate font-semibold text-xs">
								Marina Costa
							</span>
							<span className="mt-0.5 block text-[10px] text-slate-500">
								Project owner
							</span>
						</span>
						<MoreHorizontal className="h-4 w-4 text-slate-500" />
					</div>
				</div>
			</aside>
		</>
	);
}

function Topbar({
	onMenu,
	onSearch
}: {
	onMenu: () => void;
	onSearch: () => void;
}) {
	return (
		<header className="flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-slate-200 border-b bg-white px-4 py-3 sm:px-6 lg:px-8">
			<div className="flex min-w-0 items-center gap-3">
				<button
					type="button"
					onClick={onMenu}
					className="rounded-lg border border-slate-200 p-2 text-slate-500 lg:hidden"
					aria-label="Open project navigation"
				>
					<Menu className="h-4 w-4" />
				</button>
				<div className="hidden items-center gap-2 text-slate-400 text-xs sm:flex">
					<span>My projects</span>
					<span className="text-slate-300">/</span>
					<span className="font-semibold text-slate-600">
						Mentorship platform
					</span>
				</div>
				<div className="flex items-center gap-2 sm:hidden">
					<span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 font-black text-[10px] text-indigo-600">
						MP
					</span>
					<span className="truncate font-bold text-slate-800 text-xs">
						Mentorship platform
					</span>
				</div>
			</div>
			<div className="flex items-center gap-1.5 sm:gap-2">
				<button
					type="button"
					onClick={onSearch}
					className="hidden h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 font-semibold text-[11px] text-slate-500 transition hover:border-slate-300 hover:text-slate-800 md:flex"
				>
					<Search className="h-3.5 w-3.5" />
					Search
					<kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] text-slate-400">
						⌘ K
					</kbd>
				</button>
				<button
					type="button"
					onClick={onSearch}
					className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 md:hidden"
					aria-label="Search"
				>
					<Search className="h-4 w-4" />
				</button>
				<button
					type="button"
					className="relative rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
					aria-label="Notifications"
				>
					<Bell className="h-4 w-4" />
					<span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
				</button>
				<Avatar initials="MC" className="bg-rose-100 text-rose-700" />
			</div>
		</header>
	);
}

function ProgressBar({
	value,
	dark = false
}: { value: number; dark?: boolean }) {
	return (
		<div
			className={`h-1.5 overflow-hidden rounded-full ${dark ? 'bg-white/20' : 'bg-slate-100'}`}
		>
			<div
				className={`h-full rounded-full transition-all ${dark ? 'bg-white' : 'bg-indigo-500'}`}
				style={{ width: `${value}%` }}
			/>
		</div>
	);
}

function ViewHeading({ view, onAdd }: { view: ViewId; onAdd: () => void }) {
	const content: Record<
		ViewId,
		{ eyebrow: string; title: string; copy: string }
	> = {
		overview: {
			eyebrow: 'WEDNESDAY, APRIL 17 · WEEK 16',
			title: 'Good morning, Marina',
			copy: 'Here is the signal from your project today.'
		},
		board: {
			eyebrow: 'SPRINT 12 · 2 DAYS LEFT',
			title: 'Keep the work moving',
			copy: 'See the current flow, the next handoff, and what needs attention.'
		},
		backlog: {
			eyebrow: 'PRODUCT BACKLOG',
			title: 'Shape the next best thing',
			copy: 'Keep future work visible without letting it interrupt the current sprint.'
		},
		sprints: {
			eyebrow: 'SPRINTS · HISTORY',
			title: 'Cycles with a clear outcome',
			copy: 'Goals, progress, and what shipped in one timeline.'
		}
	};
	const current = content[view];
	return (
		<div className="mb-7 flex flex-wrap items-end justify-between gap-4">
			<div>
				<p className="font-bold font-mono text-[9px] text-indigo-500 tracking-[0.16em]">
					{current.eyebrow}
				</p>
				<h1 className="mt-2 font-extrabold text-2xl text-slate-900 tracking-tight sm:text-3xl">
					{current.title}
				</h1>
				<p className="mt-2 text-slate-500 text-xs leading-5">{current.copy}</p>
			</div>
			<button
				type="button"
				onClick={onAdd}
				className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2.5 font-bold text-white text-xs shadow-indigo-200 shadow-sm transition hover:bg-indigo-700"
			>
				<Plus className="h-3.5 w-3.5" />
				New task
			</button>
		</div>
	);
}

function StatCard({
	icon: Icon,
	label,
	value,
	detail,
	tone
}: {
	icon: LucideIcon;
	label: string;
	value: string;
	detail: string;
	tone: string;
}) {
	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
			<div className="flex items-center justify-between">
				<span className="font-bold text-[9px] text-slate-400 uppercase tracking-[0.14em]">
					{label}
				</span>
				<span
					className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}
				>
					<Icon className="h-4 w-4" />
				</span>
			</div>
			<p className="mt-3 font-extrabold text-2xl text-slate-900 tracking-tight">
				{value}
			</p>
			<p className="mt-1 text-[10px] text-slate-400">{detail}</p>
		</div>
	);
}

function SprintSummary() {
	return (
		<div className="rounded-2xl border border-indigo-200 bg-indigo-600 p-5 text-white shadow-[0_12px_30px_rgba(79,70,229,0.15)]">
			<div className="flex items-center justify-between">
				<span className="font-bold font-mono text-[9px] text-indigo-200 tracking-[0.14em]">
					ACTIVE SPRINT
				</span>
				<Zap className="h-4 w-4 text-indigo-200" />
			</div>
			<div className="mt-4 flex items-start justify-between gap-4">
				<div>
					<h2 className="font-extrabold text-lg tracking-tight">Sprint 12</h2>
					<p className="mt-1 text-[10px] text-indigo-200">Apr 08 – Apr 19</p>
				</div>
				<span className="rounded-full bg-white/15 px-2.5 py-1 font-bold text-[10px]">
					2 days left
				</span>
			</div>
			<p className="mt-5 max-w-md text-indigo-100 text-xs leading-5">
				Make the first week feel guided, not overwhelming.
			</p>
			<div className="mt-5">
				<div className="mb-2 flex items-center justify-between text-[10px] text-indigo-200">
					<span>16 of 26 points delivered</span>
					<strong className="text-white">62%</strong>
				</div>
				<ProgressBar value={62} dark />
			</div>
		</div>
	);
}

function TaskCard({
	task,
	onSelect,
	compact = false
}: {
	task: Task;
	onSelect: (task: Task) => void;
	compact?: boolean;
}) {
	return (
		<button
			type="button"
			onClick={() => onSelect(task)}
			className={`group hover:-translate-y-0.5 w-full rounded-xl border border-slate-200 bg-white text-left shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:border-indigo-200 hover:shadow-[0_8px_22px_rgba(30,41,59,0.08)] ${compact ? 'p-3' : 'p-4'}`}
		>
			<div className="flex items-start justify-between gap-3">
				<span className="font-mono font-semibold text-[10px] text-slate-400">
					{task.id}
				</span>
				<span
					className={`font-bold text-[10px] ${priorityStyle[task.priority]}`}
				>
					{task.priority}
				</span>
			</div>
			<p className="mt-2 font-bold text-slate-800 text-xs leading-5 group-hover:text-indigo-700">
				{task.title}
			</p>
			<div className="mt-3 flex flex-wrap gap-1.5">
				{task.labels.map((label) => (
					<span
						key={label}
						className="rounded bg-slate-100 px-2 py-1 font-semibold text-[9px] text-slate-500"
					>
						{label}
					</span>
				))}
			</div>
			<div className="mt-4 flex items-center justify-between border-slate-100 border-t pt-3">
				<div className="flex min-w-0 items-center gap-2">
					<Avatar initials={task.initials} className={task.avatar} />
					<span className="truncate text-[10px] text-slate-500">
						{task.assignee === 'Unassigned'
							? 'Unassigned'
							: task.assignee.split(' ')[0]}
					</span>
				</div>
				<span className="font-mono font-semibold text-[10px] text-slate-400">
					{task.points} pts
				</span>
			</div>
		</button>
	);
}

function AddTaskForm({
	onAdd,
	onCancel
}: { onAdd: (title: string) => void; onCancel: () => void }) {
	const [title, setTitle] = useState('');
	const submit = (event: FormEvent) => {
		event.preventDefault();
		if (!title.trim()) return;
		onAdd(title.trim());
		setTitle('');
	};
	return (
		<form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
			<input
				value={title}
				onChange={(event) => setTitle(event.target.value)}
				onKeyDown={(event) => event.key === 'Escape' && onCancel()}
				placeholder="What needs doing?"
				className="h-10 min-w-0 flex-1 rounded-lg border border-indigo-200 bg-white px-3 text-xs outline-none ring-indigo-100 placeholder:text-slate-400 focus:ring-4"
			/>
			<div className="flex gap-2">
				<button
					type="submit"
					className="rounded-lg bg-indigo-600 px-3 font-bold text-white text-xs hover:bg-indigo-700"
				>
					Add task
				</button>
				<button
					type="button"
					onClick={onCancel}
					className="rounded-lg border border-slate-200 px-3 font-semibold text-slate-500 text-xs hover:bg-slate-50"
				>
					Cancel
				</button>
			</div>
		</form>
	);
}

function FilterBar({
	query,
	onQueryChange,
	assignee,
	onAssigneeChange,
	priority,
	onPriorityChange,
	count
}: {
	query: string;
	onQueryChange: (value: string) => void;
	assignee: string;
	onAssigneeChange: (value: string) => void;
	priority: string;
	onPriorityChange: (value: string) => void;
	count: number;
}) {
	return (
		<div className="mb-5 flex flex-wrap items-center gap-2">
			<div className="relative min-w-[220px] flex-1 sm:max-w-[300px]">
				<Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-slate-400" />
				<input
					value={query}
					onChange={(event) => onQueryChange(event.target.value)}
					placeholder="Search work"
					className="h-9 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-9 text-[11px] outline-none ring-indigo-100 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4"
				/>
			</div>
			<label className="relative flex h-9 items-center rounded-lg border border-slate-200 bg-white text-[11px] text-slate-500">
				<Filter className="ml-3 h-3.5 w-3.5 text-slate-400" />
				<select
					value={assignee}
					onChange={(event) => onAssigneeChange(event.target.value)}
					className="h-full appearance-none bg-transparent px-2 pr-7 font-semibold outline-none"
				>
					<option value="all">All owners</option>
					<option value="Marina Costa">Marina Costa</option>
					<option value="Rafael Lima">Rafael Lima</option>
					<option value="João Santos">João Santos</option>
					<option value="Unassigned">Unassigned</option>
				</select>
				<ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-slate-400" />
			</label>
			<label className="relative flex h-9 items-center rounded-lg border border-slate-200 bg-white text-[11px] text-slate-500">
				<select
					value={priority}
					onChange={(event) => onPriorityChange(event.target.value)}
					className="h-full appearance-none bg-transparent px-3 pr-7 font-semibold outline-none"
				>
					<option value="all">All priorities</option>
					<option value="Urgent">Urgent</option>
					<option value="High">High</option>
					<option value="Medium">Medium</option>
					<option value="Low">Low</option>
				</select>
				<ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-slate-400" />
			</label>
			<span className="ml-auto font-mono text-[10px] text-slate-400">
				{count} items
			</span>
		</div>
	);
}

function OverviewView({
	tasks,
	onSelect,
	onView
}: {
	tasks: Task[];
	onSelect: (task: Task) => void;
	onView: (view: ViewId) => void;
}) {
	const activeTasks = tasks.filter(
		(task) => task.sprint === 'Sprint 12' && task.status !== 'Done'
	);
	const urgentTask = tasks.find((task) => task.id === 'CW-136');
	return (
		<div className="space-y-5">
			<div className="grid gap-4 xl:grid-cols-[1fr_360px]">
				<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6">
					<div className="flex items-start justify-between gap-4">
						<div>
							<div className="flex items-center gap-2">
								<span className="h-2 w-2 rounded-full bg-amber-500" />
								<span className="font-bold text-[10px] text-amber-600 uppercase tracking-[0.14em]">
									Focus today
								</span>
							</div>
							<h2 className="mt-3 font-extrabold text-lg text-slate-900 tracking-tight">
								Work in motion
							</h2>
							<p className="mt-1 text-slate-400 text-xs">
								The few items worth looking at right now.
							</p>
						</div>
						<button
							type="button"
							onClick={() => onView('board')}
							className="hidden items-center gap-1 font-bold text-[10px] text-indigo-600 hover:text-indigo-800 sm:flex"
						>
							Open board <ArrowRight className="h-3 w-3" />
						</button>
					</div>
					<div className="mt-5 space-y-2">
						{activeTasks.map((task) => (
							<button
								key={task.id}
								type="button"
								onClick={() => onSelect(task)}
								className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50/30"
							>
								<span
									className={`h-2.5 w-2.5 rounded-full ${statusStyle[task.status].dot}`}
								/>
								<span className="min-w-0">
									<span className="block truncate font-bold text-slate-800 text-xs">
										{task.title}
									</span>
									<span className="mt-1 block text-[10px] text-slate-400">
										{task.id} · {task.status} · {task.due}
									</span>
								</span>
								<span className="hidden items-center gap-2 sm:flex">
									<span
										className={`rounded-full px-2 py-1 font-bold text-[9px] ${statusStyle[task.status].soft}`}
									>
										{task.status}
									</span>
									<span className="font-mono text-[10px] text-slate-400">
										{task.points}p
									</span>
								</span>
							</button>
						))}
					</div>
					<button
						type="button"
						onClick={() => onView('board')}
						className="mt-4 flex items-center gap-1 font-bold text-[10px] text-indigo-600 sm:hidden"
					>
						Open board <ArrowRight className="h-3 w-3" />
					</button>
				</div>
				<SprintSummary />
			</div>
			<div className="grid gap-4 sm:grid-cols-3">
				<StatCard
					icon={CheckCircle2}
					label="Delivered"
					value="16 pts"
					detail="62% of Sprint 12"
					tone="bg-emerald-50 text-emerald-600"
				/>
				<StatCard
					icon={Clock3}
					label="Needs attention"
					value="2 items"
					detail="1 review · 1 urgent"
					tone="bg-amber-50 text-amber-600"
				/>
				<StatCard
					icon={Users}
					label="Team activity"
					value="4 / 7"
					detail="Contributors active today"
					tone="bg-violet-50 text-violet-600"
				/>
			</div>
			<div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
				<div className="rounded-2xl border border-slate-200 bg-white p-5">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="font-bold text-slate-900 text-sm">
								Needs a decision
							</h2>
							<p className="mt-1 text-slate-400 text-xs">
								Small signals before they become blockers.
							</p>
						</div>
						<span className="rounded-full bg-rose-50 px-2.5 py-1 font-bold text-[9px] text-rose-600">
							2 items
						</span>
					</div>
					<div className="mt-5 grid gap-3 md:grid-cols-2">
						<button
							type="button"
							onClick={() => urgentTask && onSelect(urgentTask)}
							className="flex gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-amber-200 hover:bg-amber-50/30"
						>
							<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
								<AlertCircle className="h-3.5 w-3.5" />
							</span>
							<span>
								<strong className="block font-bold text-slate-700 text-xs">
									Booking edge cases
								</strong>
								<span className="mt-1 block text-[10px] text-slate-400">
									Urgent · João Santos
								</span>
							</span>
						</button>
						<button
							type="button"
							onClick={() => onView('backlog')}
							className="flex gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-violet-200 hover:bg-violet-50/30"
						>
							<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
								<Target className="h-3.5 w-3.5" />
							</span>
							<span>
								<strong className="block font-bold text-slate-700 text-xs">
									Unowned backlog
								</strong>
								<span className="mt-1 block text-[10px] text-slate-400">
									2 items need a next step
								</span>
							</span>
						</button>
					</div>
				</div>
				<div className="rounded-2xl border border-slate-200 bg-white p-5">
					<div className="flex items-center justify-between">
						<h2 className="font-bold text-slate-900 text-sm">Team pulse</h2>
						<AvatarStack />
					</div>
					<div className="mt-5 flex items-end gap-3">
						<span className="font-extrabold text-3xl text-slate-900">Good</span>
						<span className="mb-1 font-bold text-[10px] text-emerald-600">
							↗ 8% this week
						</span>
					</div>
					<p className="mt-2 text-slate-400 text-xs leading-5">
						The team is moving steadily. One review bottleneck needs a decision.
					</p>
				</div>
			</div>
		</div>
	);
}

function BoardView({
	tasks,
	onSelect,
	onAdd
}: {
	tasks: Task[];
	onSelect: (task: Task) => void;
	onAdd: (title: string) => void;
}) {
	const columns: Status[] = ['Ready', 'In progress', 'Review', 'Done'];
	return (
		<div className="space-y-5">
			<div className="grid gap-4 xl:grid-cols-[1fr_300px]">
				<div className="min-w-0 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4">
					<div className="mb-4 flex min-w-[900px] items-center justify-between border-slate-100 border-b pb-4">
						<div className="flex items-center gap-3">
							<span className="font-bold text-slate-900 text-sm">
								Sprint flow
							</span>
							<span className="rounded-full bg-indigo-50 px-2 py-1 font-bold text-[9px] text-indigo-600">
								7 items
							</span>
						</div>
						<div className="flex items-center gap-3">
							<span className="text-[10px] text-slate-400">
								16 / 26 pts delivered
							</span>
							<div className="w-24">
								<ProgressBar value={62} />
							</div>
							<button
								type="button"
								className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
							>
								<MoreHorizontal className="h-4 w-4" />
							</button>
						</div>
					</div>
					<div className="grid min-w-[900px] grid-cols-4 gap-3">
						{columns.map((status) => {
							const columnTasks = tasks.filter(
								(task) => task.status === status && task.sprint === 'Sprint 12'
							);
							return (
								<section
									key={status}
									className="min-h-[390px] rounded-xl bg-slate-50/80 p-2.5"
								>
									<div className="mb-3 flex items-center justify-between px-1">
										<div className="flex items-center gap-2">
											<span
												className={`h-2 w-2 rounded-full ${statusStyle[status].dot}`}
											/>
											<h3 className="font-bold text-[11px] text-slate-700">
												{status}
											</h3>
										</div>
										<span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 font-mono text-[9px] text-slate-400">
											{columnTasks.length}
										</span>
									</div>
									<div className="space-y-2">
										{columnTasks.map((task) => (
											<TaskCard
												key={task.id}
												task={task}
												onSelect={onSelect}
												compact
											/>
										))}
									</div>
									{status === 'Ready' && (
										<button
											type="button"
											onClick={() => onAdd('')}
											className="mt-2 flex items-center gap-1 px-1.5 py-2 font-semibold text-[10px] text-slate-400 hover:text-indigo-600"
										>
											<Plus className="h-3 w-3" /> Add task
										</button>
									)}
								</section>
							);
						})}
					</div>
				</div>
				<aside className="space-y-4">
					<div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-white">
						<div className="flex items-center justify-between">
							<span className="font-bold font-mono text-[9px] text-slate-400 tracking-[0.14em]">
								SPRINT HEALTH
							</span>
							<CircleDashed className="h-4 w-4 text-emerald-400" />
						</div>
						<div className="mt-5 flex items-end gap-2">
							<span className="font-black text-3xl tracking-tight">Good</span>
							<span className="mb-1 text-[10px] text-emerald-400">↗ 8%</span>
						</div>
						<p className="mt-2 text-[11px] text-slate-400 leading-5">
							The team is moving steadily. One review bottleneck needs
							attention.
						</p>
						<div className="mt-5 grid grid-cols-2 gap-2">
							<div className="rounded-lg bg-white/5 p-3">
								<span className="text-[9px] text-slate-500">Delivered</span>
								<strong className="mt-1 block text-sm">16 pts</strong>
							</div>
							<div className="rounded-lg bg-white/5 p-3">
								<span className="text-[9px] text-slate-500">At risk</span>
								<strong className="mt-1 block text-amber-300 text-sm">
									1 item
								</strong>
							</div>
						</div>
					</div>
					<div className="rounded-2xl border border-slate-200 bg-white p-5">
						<div className="flex items-center justify-between">
							<h3 className="font-bold text-slate-900 text-xs">Next handoff</h3>
							<ArrowRight className="h-4 w-4 text-slate-400" />
						</div>
						<div className="mt-4 flex gap-3">
							<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
								<Users className="h-4 w-4" />
							</span>
							<div>
								<p className="font-semibold text-slate-700 text-xs">
									Rafael → Marina
								</p>
								<p className="mt-1 text-[10px] text-slate-400 leading-4">
									Empty states are ready for a product decision.
								</p>
							</div>
						</div>
						<button
							type="button"
							className="mt-5 w-full rounded-lg bg-indigo-50 py-2.5 font-bold text-[10px] text-indigo-700 hover:bg-indigo-100"
						>
							Open review queue
						</button>
					</div>
				</aside>
			</div>
		</div>
	);
}

function BacklogView({
	tasks,
	onSelect,
	onAdd
}: {
	tasks: Task[];
	onSelect: (task: Task) => void;
	onAdd: (title: string) => void;
}) {
	const unplanned = tasks.filter((task) => task.sprint === null);
	const planned = tasks.filter((task) => task.sprint === 'Sprint 13');
	const row = (task: Task) => (
		<button
			key={task.id}
			type="button"
			onClick={() => onSelect(task)}
			className="flex w-full items-center gap-3 border-slate-100 border-t px-4 py-3.5 text-left transition first:border-t-0 hover:bg-indigo-50/30"
		>
			<span className="font-mono text-[10px] text-slate-400">{task.id}</span>
			<span className="min-w-0 flex-1 truncate font-semibold text-slate-700 text-xs">
				{task.title}
			</span>
			<span
				className={`hidden rounded-full px-2 py-1 font-bold text-[9px] sm:block ${statusStyle[task.status].soft}`}
			>
				{task.priority}
			</span>
			<span className="hidden text-[10px] text-slate-400 md:block">
				{task.assignee}
			</span>
			<span className="font-mono text-[10px] text-slate-400">
				{task.points}p
			</span>
		</button>
	);
	return (
		<div className="grid gap-5 xl:grid-cols-[1fr_300px]">
			<div className="space-y-5">
				<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
					<div className="flex items-center justify-between gap-3 p-5">
						<div>
							<h2 className="font-bold text-slate-900 text-sm">
								Sprint 13 · Planning
							</h2>
							<p className="mt-1 text-slate-400 text-xs">
								{planned.length} items · 13 story points ready
							</p>
						</div>
						<button
							type="button"
							className="rounded-lg border border-slate-200 px-3 py-2 font-bold text-[10px] text-slate-600 hover:bg-slate-50"
						>
							Plan sprint
						</button>
					</div>
					{planned.map(row)}
				</div>
				<div className="overflow-hidden rounded-2xl border border-slate-300 border-dashed bg-slate-50/60">
					<div className="flex items-center justify-between gap-3 p-5">
						<div>
							<h2 className="font-bold text-slate-900 text-sm">
								Product backlog
							</h2>
							<p className="mt-1 text-slate-400 text-xs">
								{unplanned.length} items waiting for a sprint
							</p>
						</div>
						<button
							type="button"
							onClick={() => onAdd('')}
							className="flex items-center gap-1 font-bold text-[10px] text-indigo-600"
						>
							<Plus className="h-3.5 w-3.5" /> Add task
						</button>
					</div>
					<div className="overflow-hidden rounded-b-2xl bg-white">
						{unplanned.map(row)}
					</div>
				</div>
			</div>
			<aside className="space-y-4">
				<div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-white">
					<span className="font-bold font-mono text-[9px] text-slate-400 tracking-[0.14em]">
						PLANNING SIGNAL
					</span>
					<p className="mt-4 font-bold text-sm leading-6">
						13 points are ready for the next sprint.
					</p>
					<p className="mt-2 text-[11px] text-slate-400 leading-5">
						That is enough for a focused cycle. Keep the rest visible instead of
						overcommitting.
					</p>
					<div className="mt-5">
						<ProgressBar value={72} dark />
					</div>
				</div>
				<div className="rounded-2xl border border-slate-200 bg-white p-5">
					<div className="flex items-center gap-2">
						<Sparkles className="h-4 w-4 text-indigo-500" />
						<h3 className="font-bold text-slate-900 text-xs">
							Suggested next move
						</h3>
					</div>
					<p className="mt-4 text-[11px] text-slate-500 leading-5">
						Assign an owner to{' '}
						<strong className="text-slate-700">
							Define project health score
						</strong>{' '}
						before planning.
					</p>
					<button
						type="button"
						className="mt-5 w-full rounded-lg border border-slate-200 py-2 font-bold text-[10px] text-slate-600 hover:bg-slate-50"
					>
						Review unowned work
					</button>
				</div>
			</aside>
		</div>
	);
}

function SprintsView({ onView }: { onView: (view: ViewId) => void }) {
	return (
		<div className="space-y-5">
			<div className="relative ml-2 border-slate-200 border-l pl-7">
				{sprints.map((sprint, index) => (
					<article key={sprint.name} className="relative pb-5 last:pb-0">
						<span
							className={`-left-[35px] absolute top-1 h-4 w-4 rounded-full border-4 border-[#f5f7fb] ${sprint.color}`}
						/>
						<div
							className={`rounded-2xl border p-5 ${index === 0 ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-200 bg-white'}`}
						>
							<div className="flex flex-wrap items-start justify-between gap-4">
								<div className="min-w-[200px] flex-1">
									<div className="flex items-center gap-2">
										<h2 className="font-bold text-slate-900 text-sm">
											{sprint.name}
										</h2>
										<span
											className={`rounded-full px-2 py-1 font-bold text-[9px] ${sprint.status === 'Active' ? 'bg-indigo-100 text-indigo-700' : sprint.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}
										>
											{sprint.status}
										</span>
									</div>
									<p className="mt-2 text-[10px] text-slate-400">
										{sprint.dates}
									</p>
									<p className="mt-5 max-w-md text-slate-600 text-xs leading-5">
										{sprint.goal}
									</p>
								</div>
								<div className="w-full max-w-[220px]">
									<div className="mb-2 flex justify-between text-[10px] text-slate-400">
										<span>Delivered</span>
										<strong className="text-slate-700">
											{sprint.progress}%
										</strong>
									</div>
									<ProgressBar value={sprint.progress} />
									<div className="mt-3 flex justify-between font-mono text-[10px] text-slate-400">
										<span>{sprint.points} pts</span>
										<span>
											{sprint.completed}/{sprint.total || '—'} tasks
										</span>
									</div>
								</div>
							</div>
							{index === 0 && (
								<button
									type="button"
									onClick={() => onView('board')}
									className="mt-5 border-slate-200 border-t pt-3 font-bold text-[10px] text-indigo-600"
								>
									View current work →
								</button>
							)}
						</div>
					</article>
				))}
			</div>
			<div className="grid gap-4 sm:grid-cols-3">
				<StatCard
					icon={CheckCircle2}
					label="Shipped"
					value="16 pts"
					detail="Sprint 12"
					tone="bg-emerald-50 text-emerald-600"
				/>
				<StatCard
					icon={Zap}
					label="In motion"
					value="7 pts"
					detail="Across 3 tasks"
					tone="bg-indigo-50 text-indigo-600"
				/>
				<StatCard
					icon={Clock3}
					label="Avg. cycle"
					value="4.2 days"
					detail="Down 12% from last sprint"
					tone="bg-amber-50 text-amber-600"
				/>
			</div>
		</div>
	);
}

function TaskDrawer({
	task,
	onClose,
	onComplete
}: {
	task: Task;
	onClose: () => void;
	onComplete: () => void;
}) {
	return (
		<aside className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-[380px] flex-col border-slate-200 border-l bg-white shadow-[-12px_0_35px_rgba(15,23,42,0.14)]">
			<div className="flex items-center justify-between border-slate-100 border-b px-5 py-4">
				<span className="font-bold font-mono text-slate-400 text-xs">
					{task.id}
				</span>
				<button
					type="button"
					onClick={onClose}
					aria-label="Close task details"
					className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
				>
					<X className="h-4 w-4" />
				</button>
			</div>
			<div className="flex-1 overflow-y-auto p-5">
				<div className="flex items-center gap-2">
					<span
						className={`h-2 w-2 rounded-full ${statusStyle[task.status].dot}`}
					/>
					<span className="font-bold text-slate-500 text-xs">
						{task.status}
					</span>
				</div>
				<h2 className="mt-4 font-extrabold text-slate-900 text-xl leading-7">
					{task.title}
				</h2>
				<p className="mt-3 text-slate-500 text-xs leading-5">
					{task.description}
				</p>
				<div className="mt-6 grid grid-cols-2 gap-3">
					<div className="rounded-xl bg-slate-50 p-3">
						<span className="block font-bold text-[9px] text-slate-400 uppercase">
							Priority
						</span>
						<span
							className={`mt-2 block font-bold text-xs ${priorityStyle[task.priority]}`}
						>
							{task.priority}
						</span>
					</div>
					<div className="rounded-xl bg-slate-50 p-3">
						<span className="block font-bold text-[9px] text-slate-400 uppercase">
							Estimate
						</span>
						<span className="mt-2 block font-bold text-slate-700 text-xs">
							{task.points} points
						</span>
					</div>
				</div>
				<div className="mt-6 space-y-4 border-slate-100 border-t pt-5">
					<div className="flex items-center justify-between text-xs">
						<span className="text-slate-400">Owner</span>
						<span className="flex items-center gap-2 font-semibold text-slate-700">
							<Avatar initials={task.initials} className={task.avatar} />
							{task.assignee}
						</span>
					</div>
					<div className="flex items-center justify-between text-xs">
						<span className="text-slate-400">Sprint</span>
						<span className="font-semibold text-slate-700">
							{task.sprint ?? 'Backlog'}
						</span>
					</div>
					<div className="flex items-center justify-between text-xs">
						<span className="text-slate-400">Due date</span>
						<span className="font-semibold text-slate-700">{task.due}</span>
					</div>
				</div>
				<div className="mt-6 flex flex-wrap gap-1.5 border-slate-100 border-t pt-5">
					{task.labels.map((label) => (
						<span
							key={label}
							className="rounded-full bg-indigo-50 px-2.5 py-1 font-bold text-[10px] text-indigo-600"
						>
							{label}
						</span>
					))}
				</div>
			</div>
			<div className="border-slate-100 border-t p-5">
				<button
					type="button"
					onClick={onComplete}
					className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 font-bold text-white text-xs transition hover:bg-indigo-600"
				>
					<Check className="h-4 w-4" /> Mark as complete
				</button>
			</div>
		</aside>
	);
}

export default function WorkspaceRedesignPrototype() {
	const [view, setView] = useState<ViewId>('overview');
	const [tasks, setTasks] = useState<Task[]>(seedTasks);
	const [selectedTask, setSelectedTask] = useState<Task | null>(null);
	const [mobileNavOpen, setMobileNavOpen] = useState(false);
	const [isAdding, setIsAdding] = useState(false);
	const [query, setQuery] = useState('');
	const [assignee, setAssignee] = useState('all');
	const [priority, setPriority] = useState('all');

	const focusSearch = useCallback(() => {
		setView('board');
		window.setTimeout(() => {
			document
				.querySelector<HTMLInputElement>('input[placeholder="Search work"]')
				?.focus();
		}, 0);
	}, []);

	useEffect(() => {
		const handleShortcut = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault();
				focusSearch();
			}
		};
		window.addEventListener('keydown', handleShortcut);
		return () => window.removeEventListener('keydown', handleShortcut);
	}, [focusSearch]);

	const filteredTasks = useMemo(
		() =>
			tasks.filter((task) => {
				const matchesQuery = `${task.id} ${task.title} ${task.labels.join(' ')}`
					.toLowerCase()
					.includes(query.toLowerCase());
				const matchesAssignee =
					assignee === 'all' || task.assignee === assignee;
				const matchesPriority =
					priority === 'all' || task.priority === priority;
				return matchesQuery && matchesAssignee && matchesPriority;
			}),
		[assignee, priority, query, tasks]
	);

	const addTask = (title: string) => {
		if (!title) {
			setIsAdding(true);
			return;
		}
		const newTask: Task = {
			id: `CW-${150 + tasks.length}`,
			title,
			status: 'Inbox',
			priority: 'Medium',
			points: 3,
			assignee: 'Unassigned',
			initials: '?',
			avatar: 'bg-slate-100 text-slate-500',
			labels: ['New'],
			sprint: null,
			due: 'No due date',
			description: 'A new task added during the workspace redesign exploration.'
		};
		setTasks((current) => [newTask, ...current]);
		setIsAdding(false);
	};

	const completeTask = (taskId: string) => {
		setTasks((current) =>
			current.map((task) =>
				task.id === taskId ? { ...task, status: 'Done' } : task
			)
		);
		setSelectedTask(null);
	};

	return (
		<div className="-m-6 min-h-[calc(100vh-4.5rem)] bg-[#f5f7fb]">
			<div className="flex min-h-[calc(100vh-4.5rem)]">
				<ProjectSidebar
					view={view}
					onViewChange={setView}
					mobileOpen={mobileNavOpen}
					onClose={() => setMobileNavOpen(false)}
					backlogCount={tasks.filter((task) => task.sprint === null).length}
				/>
				<div className="min-w-0 flex-1">
					<Topbar
						onMenu={() => setMobileNavOpen(true)}
						onSearch={focusSearch}
					/>
					<main className="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-8">
						<ViewHeading view={view} onAdd={() => setIsAdding(true)} />
						{isAdding && (
							<div className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50/60 p-3">
								<AddTaskForm
									onAdd={addTask}
									onCancel={() => setIsAdding(false)}
								/>
							</div>
						)}
						{view !== 'overview' && (
							<FilterBar
								query={query}
								onQueryChange={setQuery}
								assignee={assignee}
								onAssigneeChange={setAssignee}
								priority={priority}
								onPriorityChange={setPriority}
								count={filteredTasks.length}
							/>
						)}
						{view === 'overview' && (
							<OverviewView
								tasks={tasks}
								onSelect={setSelectedTask}
								onView={setView}
							/>
						)}
						{view === 'board' && (
							<BoardView
								tasks={filteredTasks}
								onSelect={setSelectedTask}
								onAdd={addTask}
							/>
						)}
						{view === 'backlog' && (
							<BacklogView
								tasks={filteredTasks}
								onSelect={setSelectedTask}
								onAdd={addTask}
							/>
						)}
						{view === 'sprints' && <SprintsView onView={setView} />}
					</main>
				</div>
			</div>
			{selectedTask && (
				<>
					<button
						type="button"
						aria-label="Close task details"
						onClick={() => setSelectedTask(null)}
						className="fixed inset-0 z-50 bg-slate-950/30"
					/>
					<TaskDrawer
						task={selectedTask}
						onClose={() => setSelectedTask(null)}
						onComplete={() => completeTask(selectedTask.id)}
					/>
				</>
			)}
			<div className="pointer-events-none fixed right-4 bottom-4 hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] text-slate-400 shadow-lg xl:flex">
				<Command className="h-3.5 w-3.5" /> Press{' '}
				<kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px]">
					⌘ K
				</kbd>{' '}
				to search
			</div>
		</div>
	);
}
