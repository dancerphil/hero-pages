import type { UserPage, AnswerRecord } from '@/shared/user';
import { createInterface } from './createInterface';

export const apiGetUser = createInterface<{ uid: string }, UserPage>('GET', '/api/users/{uid}');
export const apiGetUserAnswers = createInterface<{ uid: string }, AnswerRecord[]>('GET', '/api/users/{uid}/answers');
export const apiPutUserAvatar = createInterface<FormData, void>('PUT', '/api/users/me/avatar');
