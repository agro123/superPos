import type { AppError } from '@/shared/domain/errors';

/** Todos los errores de consultas y mutaciones son `AppError` (los repositorios los mapean). */
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: AppError;
  }
}
