import { Send } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback } from '~/common/components/ui/avatar';
import { Button } from '~/common/components/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '~/common/components/ui/card';
import { ScrollArea } from '~/common/components/ui/scroll-area';
import { Textarea } from '~/common/components/ui/textarea';
import type { Discussion } from '../types/Projects.type';

interface ProjectDiscussionsProps {
	discussions: Discussion[];
}

export function ProjectDiscussions({ discussions }: ProjectDiscussionsProps) {
	const [newMessage, setNewMessage] = useState('');

	const handleSendMessage = () => {
		if (newMessage.trim()) {
			// In a real application, you would send this message to your backend
			setNewMessage('');
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Project Discussions</CardTitle>
			</CardHeader>
			<CardContent>
				<ScrollArea className="h-[300px] pr-4">
					{discussions.map((discussion) => (
						<div
							key={discussion.id}
							className="mb-4 border-b pb-4 last:border-b-0"
						>
							<div className="mb-2 flex items-center">
								<Avatar className="mr-2 h-6 w-6">
									<AvatarFallback>{discussion.user[0]}</AvatarFallback>
								</Avatar>
								<span className="font-semibold">{discussion.user}</span>
								<span className="ml-2 text-muted-foreground text-sm">
									{new Date(discussion.timestamp).toLocaleString()}
								</span>
							</div>
							<p className="text-muted-foreground">{discussion.message}</p>
						</div>
					))}
				</ScrollArea>
				<div className="mt-4 flex items-center space-x-2">
					<Textarea
						placeholder="Type your message here"
						value={newMessage}
						onChange={(e) => setNewMessage(e.target.value)}
						className="flex-grow"
					/>
					<Button
						onClick={handleSendMessage}
						className="bg-primary text-primary-foreground hover:bg-primary/90"
					>
						<Send className="mr-2 h-4 w-4" />
						Send
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
