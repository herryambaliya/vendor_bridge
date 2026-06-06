import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Logs an activity to the database in a fire-and-forget manner.
 * Errors are silently caught — this should never break a calling route.
 *
 * @param userId     - The ID of the user performing the action
 * @param entityType - The entity type (e.g., 'vendor', 'rfq')
 * @param entityId   - The ID of the entity being acted upon
 * @param action     - A short description of the action (e.g., 'created', 'updated')
 * @param metadata   - Optional additional metadata to store as JSON
 */
export function logActivity(
  userId: string,
  entityType: string,
  entityId: string,
  action: string,
  metadata?: object
): void {
  prisma.activityLog
    .create({
      data: {
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        action,
        metadata: metadata ?? Prisma.JsonNull,
      },
    })
    .catch((err: unknown) => {
      // Silently fail — activity logging must never interrupt business logic
      console.error('[logActivity] Failed to log activity:', err);
    });
}
