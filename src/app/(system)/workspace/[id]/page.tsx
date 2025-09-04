import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Workspace from '~/features/workspace/components/Workspace';

export default function WorkspacePage() {
	const { userId } = auth();
	if (!userId) {
		return redirect('/');
	}

	return <Workspace />;
}
