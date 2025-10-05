/**
 * User Repository
 * Data access layer for User entities
 */

import { BaseRepository } from '@/core/application/base/BaseRepository';
import { Result } from '@/core/domain/base/Result';
import { supabase } from '@/core/infrastructure/supabase/client';
import { User } from '../domain/User.entity';
import { UserMapper, UserPersistenceModel } from './UserMapper';

export class UserRepository extends BaseRepository<User, UserPersistenceModel> {
  constructor() {
    super(supabase, 'users', new UserMapper());
  }

  async findByEmail(email: string): Promise<Result<User | null, Error>> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.ok(null);
        }
        return Result.fail(new Error(error.message));
      }

      const user = this.mapper.toDomain(data as UserPersistenceModel);
      return Result.ok(user);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  async searchByName(query: string): Promise<Result<User[], Error>> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .ilike('name', `%${query}%`);

      if (error) {
        return Result.fail(new Error(error.message));
      }

      const users = (data as UserPersistenceModel[]).map((item) =>
        this.mapper.toDomain(item)
      );
      return Result.ok(users);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }
}
