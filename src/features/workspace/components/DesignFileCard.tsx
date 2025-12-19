'use client';

import { Button } from '~/common/components/ui/button';
import { Card, CardContent } from '~/common/components/ui/card';

interface DesignFileCardProps {
	figmaProjectUrl: string;
}

export function DesignFileCard({ figmaProjectUrl }: DesignFileCardProps) {
	return (
		<Card className="mb-4 border-0 bg-gradient-to-r from-epic-muted to-epic-muted/80 shadow-lg backdrop-blur-sm">
			<CardContent className="p-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-epic-muted">
							<span className="text-xl">🖼️</span>
						</div>
						<div>
							<h2 className="font-semibold text-base text-foreground">
								Design File
							</h2>
							<p className="text-muted-foreground text-xs">
								Reference the project designs and mockups
							</p>
						</div>
					</div>
					<Button
						asChild
						size="sm"
						className="bg-epic text-epic-foreground hover:bg-epic/90"
					>
						<a href={figmaProjectUrl} target="_blank" rel="noopener noreferrer">
							View on Figma
						</a>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
