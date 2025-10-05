/**
 * Base Repository Implementation
 * Abstract base class for Supabase repositories
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Result } from '@/core/domain/base/Result';
import { IRepository } from './IRepository';
import { IMapper } from './IMapper';

export abstract class BaseRepository<DomainEntity, PersistenceModel>
  implements IRepository<DomainEntity>
{
  constructor(
    protected readonly client: SupabaseClient,
    protected readonly tableName: string,
    protected readonly mapper: IMapper<DomainEntity, PersistenceModel>
  ) {}

  async findById(id: string): Promise<Result<DomainEntity | null, Error>> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.ok(null);
        }
        return Result.fail(new Error(error.message));
      }

      const entity = this.mapper.toDomain(data as PersistenceModel);
      return Result.ok(entity);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  async findAll(): Promise<Result<DomainEntity[], Error>> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*');

      if (error) {
        return Result.fail(new Error(error.message));
      }

      const entities = (data as PersistenceModel[]).map((item) =>
        this.mapper.toDomain(item)
      );
      return Result.ok(entities);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  async save(entity: DomainEntity): Promise<Result<DomainEntity, Error>> {
    try {
      const persistenceModel = this.mapper.toPersistence(entity);
      const { data, error } = await this.client
        .from(this.tableName)
        .insert(persistenceModel as never)
        .select()
        .single();

      if (error) {
        return Result.fail(new Error(error.message));
      }

      const savedEntity = this.mapper.toDomain(data as PersistenceModel);
      return Result.ok(savedEntity);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  async update(
    id: string,
    entity: Partial<DomainEntity>
  ): Promise<Result<DomainEntity, Error>> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .update(entity as never)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return Result.fail(new Error(error.message));
      }

      const updatedEntity = this.mapper.toDomain(data as PersistenceModel);
      return Result.ok(updatedEntity);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  async delete(id: string): Promise<Result<boolean, Error>> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        return Result.fail(new Error(error.message));
      }

      return Result.ok(true);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }
}
