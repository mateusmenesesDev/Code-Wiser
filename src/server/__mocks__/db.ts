import type { PrismaClient } from '@prisma/client';
import { beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

beforeEach(() => {
	mockReset(mockDb);
});

const mockDb = mockDeep<PrismaClient>();
export default mockDb;
