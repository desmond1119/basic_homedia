/**
 * Repository Interface
 * Generic repository pattern for data access
 */

import { Result } from '@/core/domain/base/Result';

export interface IRepository<T> {
  findById(id: string): Promise<Result<T | null, Error>>;
  findAll(): Promise<Result<T[], Error>>;
  save(entity: T): Promise<Result<T, Error>>;
  update(id: string, entity: Partial<T>): Promise<Result<T, Error>>;
  delete(id: string): Promise<Result<boolean, Error>>;
}
