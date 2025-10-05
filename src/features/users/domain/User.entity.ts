/**
 * User Entity
 * Domain model representing a user
 */

import { Entity } from '@/core/domain/base/Entity';

export interface UserProps {
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends Entity<UserProps> {
  private constructor(id: string, props: UserProps) {
    super(id, props);
  }

  public static create(id: string, props: UserProps): User {
    return new User(id, props);
  }

  public get email(): string {
    return this.props.email;
  }

  public get name(): string {
    return this.props.name;
  }

  public get avatarUrl(): string | null {
    return this.props.avatarUrl;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public updateName(name: string): User {
    return new User(this._id, {
      ...this.props,
      name,
      updatedAt: new Date(),
    });
  }

  public updateAvatar(avatarUrl: string): User {
    return new User(this._id, {
      ...this.props,
      avatarUrl,
      updatedAt: new Date(),
    });
  }
}
