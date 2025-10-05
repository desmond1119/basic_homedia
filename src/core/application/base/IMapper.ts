/**
 * Mapper Interface
 * Converts between domain entities and persistence/DTO models
 */

export interface IMapper<DomainEntity, PersistenceModel> {
  toDomain(raw: PersistenceModel): DomainEntity;
  toPersistence(entity: DomainEntity): PersistenceModel;
}
