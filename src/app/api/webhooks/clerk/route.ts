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
	console.log('WEBHOOK_SECRET', WEBHOOK_SECRET);

	if (!WEBHOOK_SECRET) {
		console.error('Missing CLERK_WEBHOOK_SECRET');
		return new Response('Missing CLERK_WEBHOOK_SECRET', {
			status: 500
		});
	}

	// Get the headers
	const headerPayload = headers();
	const svix_id = headerPayload.get('svix-id');
	const svix_timestamp = headerPayload.get('svix-timestamp');
	const svix_signature = headerPayload.get('svix-signature');

	// If there are no headers, error out
	if (!svix_id || !svix_timestamp || !svix_signature) {
		console.error('Missing Svix headers:', {
			'svix-id': svix_id,
			'svix-timestamp': svix_timestamp,
			'svix-signature': svix_signature
		});
		return new Response('Missing Svix headers', {
			status: 400
		});
	}

	// Get the body
	let payload: Record<string, unknown>;
	try {
		payload = await req.json();
	} catch (err) {
		console.error('Error parsing webhook body:', err);
		return new Response('Error parsing webhook body', {
			status: 400
		});
	}

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
		console.error('Error verifying webhook:', err, {
			body,
			headers: {
				'svix-id': svix_id,
				'svix-timestamp': svix_timestamp,
				'svix-signature': svix_signature
			}
		});
		return new Response('Error verifying webhook signature', {
			status: 401
		});
	}

	// Do something with the payload
	const { id } = evt.data;
	const eventType = evt.type;
	console.log(`Processing webhook: type=${eventType}, id=${id}`);

	try {
		switch (eventType) {
			case 'user.created':
				if (
					evt.data.email_addresses[0]?.linked_to[0]?.type !== 'oauth_google'
				) {
					console.log('Skipping non-Google OAuth user creation');
					return new Response('No need to create user', {
						status: 200
					});
				}
				if (!evt.data.email_addresses[0]?.email_address) {
					console.error('Missing email address in user.created event');
					return new Response('Error occurred -- no email address', {
						status: 400
					});
				}
				await createUser(
					evt.data.email_addresses[0]?.email_address,
					evt.data.id
				);
				break;
			case 'user.updated':
				await updateUser(evt.data.id, {
					email: evt.data.email_addresses[0]?.email_address,
					name: `${evt.data.first_name} ${evt.data.last_name}`
				});
				break;
			case 'user.deleted':
				if (!evt.data.id) {
					console.error('Missing user ID in user.deleted event');
					return new Response('Error occurred -- no user id', {
						status: 400
					});
				}
				await deleteUser(evt.data.id);
				break;
			default:
				console.log(`Unhandled webhook event type: ${eventType}`);
		}

		return new Response('Webhook processed successfully', { status: 200 });
	} catch (error) {
		console.error('Error processing webhook:', error);
		return new Response('Error processing webhook', { status: 500 });
	}
}
