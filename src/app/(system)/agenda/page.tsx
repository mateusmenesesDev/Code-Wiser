import type { Metadata } from 'next';
import AgendaPage from '~/features/agenda/components/AgendaPage';

export const metadata: Metadata = {
	title: 'Task agenda',
	description: 'See upcoming and overdue tasks across your projects.'
};

export default function AgendaRoute() {
	return <AgendaPage />;
}
