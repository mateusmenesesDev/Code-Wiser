'use client';

import { useUser } from '~/common/hooks/useUser';
import { env } from '~/env';

export function InlineBooker() {
	const { userEmail, userName } = useUser();

	return (
		<div className="w-full overflow-hidden rounded-lg border">
			<iframe
				src={`https://cal.com/${env.NEXT_PUBLIC_CALCOM_USERNAME}/individual-mentorship?email=${userEmail}&name=${userName}`}
				width="100%"
				height="800"
				frameBorder="0"
				style={{
					border: 'none',
					overflow: 'hidden'
				}}
				title="Book a mentorship session"
			/>
		</div>
	);
}
