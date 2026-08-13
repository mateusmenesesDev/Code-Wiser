import type { z } from 'zod';
import type {
	createProductVersionSchema,
	updateProductVersionSchema
} from '../schemas/productVersion.schema';

export type CreateProductVersionInput = z.infer<
	typeof createProductVersionSchema
>;
export type UpdateProductVersionInput = z.infer<
	typeof updateProductVersionSchema
>;
