import type { WebhookEvent } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { env } from '~/env';
import {
	createUser,
	deleteUser,
	updateUser
} from '~/server/api/routers/user/queries';

export async function POST(req: Request) {
	// You can find this in the Clerk Dashboard -> Webhooks -> choose the endpoint
	const WEBHOOK_SECRET = env.CLERK_WEBHOOK_SECRET;

	if (!WEBHOOK_SECRET) {
		throw new Error(
			'Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local'
		);
	}

	// Get the headers
	const headerPayload = headers();
	const svix_id = headerPayload.get('svix-id');
	const svix_timestamp = headerPayload.get('svix-timestamp');
	const svix_signature = headerPayload.get('svix-signature');

	// If there are no headers, error out
	if (!svix_id || !svix_timestamp || !svix_signature) {
		return new Response('Error occured -- no svix headers', {
			status: 400
		});
	}

	// Get the body
	const payload = (await req.json()) as Record<string, unknown>;
	const body = JSON.stringify(payload);

	// Create a new Svix instance with your secret.
	const wh = new Webhook(WEBHOOK_SECRET);

	let evt: WebhookEvent;

	// Verify the payload with the headers
	try {
		evt = wh.verify(body, {
			'svix-id': svix_id,
			'svix-timestamp': svix_timestamp,
			'svix-signature': svix_signature
		}) as WebhookEvent;
	} catch (err) {
		console.error('Error verifying webhook:', err);
		return new Response('Error occured', {
			status: 400
		});
	}

	// Do something with the payload
	const { id } = evt.data;
	const eventType = evt.type;
	console.log(`Webhook with and ID of ${id} and type of ${eventType}`);
	console.log('Webhook body:', body);

	const allowedOAuthProviders = ['oauth_google', 'oauth_github'];

	switch (eventType) {
		case 'user.created':
			if (
				!allowedOAuthProviders.includes(
					evt.data.email_addresses[0]?.linked_to[0]?.type ?? ''
				)
			) {
				return new Response('User is not an allowed OAuth provider', {
					status: 400
				});
			}
			if (!evt.data.email_addresses[0]?.email_address) {
				return new Response('User is not an allowed OAuth provider', {
					status: 400
				});
			}
			await createUser({
				email: evt.data.email_addresses[0]?.email_address,
				name: `${evt.data.first_name} ${evt.data.last_name}`,
				id: evt.data.id
			});
			break;
		case 'user.updated':
			await updateUser(evt.data.id, {
				email: evt.data.email_addresses[0]?.email_address,
				name: `${evt.data.first_name} ${evt.data.last_name}`
			});
			break;
		case 'user.deleted':
			if (!evt.data.id) {
				return new Response('Error occured -- no user id', {
					status: 400
				});
			}
			await deleteUser(evt.data.id);
			break;
	}

	return new Response('', { status: 200 });
}
