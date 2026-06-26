import type { Publication } from "@/domain/entities/publication.entity";

export interface IPublicationRepository {
  findById(id: string): Promise<Publication | null>;
  findByIdAndUserId(id: string, userId: string): Promise<Publication | null>;
  save(publication: Publication): Promise<Publication>;
}
