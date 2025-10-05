/**
 * User Mapper
 * Converts between User entity and database model
 */

import { IMapper } from '@/core/application/base/IMapper';
import { User, UserProps } from '../domain/User.entity';

export interface UserPersistenceModel {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export class UserMapper implements IMapper<User, UserPersistenceModel> {
  toDomain(raw: UserPersistenceModel): User {
    const props: UserProps = {
      email: raw.email,
      name: raw.name,
      avatarUrl: raw.avatar_url,
      createdAt: new Date(raw.created_at),
      updatedAt: new Date(raw.updated_at),
    };

    return User.create(raw.id, props);
  }

  toPersistence(entity: User): UserPersistenceModel {
    return {
      id: entity.id,
      email: entity.email,
      name: entity.name,
      avatar_url: entity.avatarUrl,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }
}
