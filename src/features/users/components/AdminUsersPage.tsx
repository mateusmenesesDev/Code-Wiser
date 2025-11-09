'use client';

import { Protect } from '@clerk/nextjs';
import { Edit, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ConfirmationDialog from '~/common/components/ConfirmationDialog';
import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from '~/common/components/ui/avatar';
import { Badge } from '~/common/components/ui/badge';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { Input } from '~/common/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/common/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/common/components/ui/table';
import { api } from '~/trpc/react';
import { EditUserDialog } from './EditUserDialog';
import { toast } from 'sonner';

export default function AdminUsersPage() {
	const [searchTerm, setSearchTerm] = useState('');
	const [mentorshipStatusFilter, setMentorshipStatusFilter] = useState<
		'all' | 'ACTIVE' | 'INACTIVE'
	>('all');
	const [editingUser, setEditingUser] = useState<string | null>(null);

	const { data, isLoading, refetch } = api.user.listAll.useQuery({
		search: searchTerm || undefined,
		mentorshipStatus:
			mentorshipStatusFilter !== 'all' ? mentorshipStatusFilter : undefined
	});

	const deleteUserMutation = api.user.delete.useMutation({
		onSuccess: () => {
			toast.success('User deleted successfully');
			refetch();
		},
		onError: (error) => {
			toast.error(`Failed to delete user: ${error.message}`);
		}
	});

	const handleDeleteUser = (userId: string) => {
		deleteUserMutation.mutate(userId);
	};

	const clearFilters = () => {
		setSearchTerm('');
		setMentorshipStatusFilter('all');
	};

	const hasActiveFilters =
		searchTerm !== '' || mentorshipStatusFilter !== 'all';

	const getInitials = (name: string | null | undefined) => {
		if (!name) return '?';
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	};

	const formatDate = (date: Date | null | undefined) => {
		if (!date) return 'N/A';
		return new Date(date).toLocaleDateString();
	};

	return (
		// biome-ignore lint/a11y/useValidAriaRole: <explanation>
		<Protect role="org:admin">
			<div className="container mx-auto px-4 py-8">
				{/* Page Header */}
				<div className="mb-8">
					<h1 className="font-bold text-3xl text-foreground">
						User Management
					</h1>
					<p className="mt-2 text-muted-foreground">
						Manage users, credits, and mentorship status
					</p>
				</div>

				{/* Filters */}
				<Card className="mb-6">
					<CardHeader>
						<CardTitle level={2} className="text-lg">
							Filters & Search
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
							<div className="relative">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search by name or email..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
							</div>

							<Select
								value={mentorshipStatusFilter}
								onValueChange={(value) =>
									setMentorshipStatusFilter(
										value as 'all' | 'ACTIVE' | 'INACTIVE'
									)
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Mentorship Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="ACTIVE">Active</SelectItem>
									<SelectItem value="INACTIVE">Inactive</SelectItem>
								</SelectContent>
							</Select>

							{hasActiveFilters && (
								<Button variant="outline" onClick={clearFilters}>
									Clear Filters
								</Button>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Results Summary */}
				<div className="mb-6 flex items-center justify-between">
					<p className="text-muted-foreground">
						Showing{' '}
						<span className="font-semibold">{data?.users.length ?? 0}</span> of{' '}
						<span className="font-semibold">{data?.total ?? 0}</span> users
					</p>
				</div>

				{/* Users Table */}
				<Card>
					<CardContent className="p-0">
						{isLoading ? (
							<div className="p-8 text-center">
								<div className="mx-auto h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
								<p className="mt-2 text-muted-foreground">Loading users...</p>
							</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>User</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Credits</TableHead>
										<TableHead>Mentorship</TableHead>
										<TableHead>Mentorship Type</TableHead>
										<TableHead>Joined</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{data?.users.map((user) => (
										<TableRow key={user.id}>
											<TableCell>
												<div className="flex items-center gap-3">
													<Avatar>
														<AvatarImage
															src={user.imageUrl ?? undefined}
															alt={user.name ?? 'User'}
														/>
														<AvatarFallback>
															{getInitials(user.name)}
														</AvatarFallback>
													</Avatar>
													<div>
														<div className="font-medium">
															{user.name || 'No name'}
														</div>
														<div className="text-muted-foreground text-sm">
															ID: {user.id.slice(0, 8)}...
														</div>
													</div>
												</div>
											</TableCell>
											<TableCell>{user.email}</TableCell>
											<TableCell>
												<Badge variant="secondary">
													{user.credits} credits
												</Badge>
											</TableCell>
											<TableCell>
												<Badge
													variant={
														user.mentorshipStatus === 'ACTIVE'
															? 'default'
															: 'secondary'
													}
												>
													{user.mentorshipStatus}
												</Badge>
											</TableCell>
											<TableCell>
												{user.mentorshipType ? (
													<Badge variant="outline">{user.mentorshipType}</Badge>
												) : (
													<span className="text-muted-foreground text-sm">
														N/A
													</span>
												)}
											</TableCell>
											<TableCell className="text-muted-foreground text-sm">
												{formatDate(user.createdAt)}
											</TableCell>
											<TableCell className="text-right">
												<div className="flex items-center justify-end gap-2">
													<Button
														variant="ghost"
														size="sm"
														onClick={() => setEditingUser(user.id)}
													>
														<Edit className="h-4 w-4" />
													</Button>
													<ConfirmationDialog
														title="Delete User"
														description={`Are you sure you want to delete user "${user.name || user.email}"? This action cannot be undone.`}
														onConfirm={() => handleDeleteUser(user.id)}
													>
														<Button
															variant="ghost"
															size="sm"
															disabled={deleteUserMutation.isPending}
															className="text-destructive hover:text-destructive"
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</ConfirmationDialog>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>

				{data?.users.length === 0 && !isLoading && (
					<div className="py-12 text-center">
						<p className="text-muted-foreground">
							No users found matching your criteria.
						</p>
					</div>
				)}

				{/* Edit User Dialog */}
				{editingUser && (
					<EditUserDialog
						userId={editingUser}
						open={!!editingUser}
						onOpenChange={(open) => {
							if (!open) setEditingUser(null);
						}}
						onUserUpdated={() => {
							refetch();
							setEditingUser(null);
						}}
					/>
				)}
			</div>
		</Protect>
	);
}
