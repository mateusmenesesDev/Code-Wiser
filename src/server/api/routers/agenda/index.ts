import { createTRPCRouter } from '~/server/api/trpc';
import { agendaRouter as procedures } from './agenda.router';

export const agendaRouter = createTRPCRouter(procedures);
