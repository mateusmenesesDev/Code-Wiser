import { useAutoAnimate } from '@formkit/auto-animate/react';
import type { RefCallback } from 'react';

export function useAnimate<T extends HTMLElement>(): [RefCallback<T>] {
	const [ref] = useAutoAnimate<T>();
	return [ref];
}
