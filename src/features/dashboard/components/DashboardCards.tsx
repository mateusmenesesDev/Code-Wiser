import { dashboardCards } from '../constants';
import { DashboardCard } from './DashboardCard';

export function DashboardCards() {
	return (
		<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
			{dashboardCards.map((card) => (
				<DashboardCard
					key={card.title}
					title={card.title}
					value={card.value}
					description={card.description}
					icon={card.icon}
					iconColor={card.iconColor}
				/>
			))}
		</div>
	);
}
