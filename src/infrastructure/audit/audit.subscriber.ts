import {
    EventSubscriber,
    EntitySubscriberInterface,
    InsertEvent,
    UpdateEvent,
    RemoveEvent,
} from 'typeorm';
import { auditLogger } from '~/infrastructure/audit/audit.logger';

@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
    afterInsert(event: InsertEvent<any>) {
        const entityName = event.metadata.name;
        const entityData = JSON.stringify(event.entity, null, 2);

        auditLogger.info(
            `[CREATE] Entity "${entityName}" created:\n${entityData}`
        );
    }

    afterUpdate(event: UpdateEvent<any>) {
        const entityName = event.metadata.name;

        const oldValues = event.databaseEntity;
        const newValues = event.entity;

        const updatedColumns = event.updatedColumns.map(
            (col) => col.propertyName
        );

        auditLogger.info(
            `[UPDATE] Entity "${entityName}" updated:\n` +
                `Updated fields: ${updatedColumns.join(', ') || 'unknown'}\n` +
                `Old values: ${JSON.stringify(oldValues, null, 2)}\n` +
                `New values: ${JSON.stringify(newValues, null, 2)}`
        );
    }

    afterRemove(event: RemoveEvent<any>) {
        const entityName = event.metadata.name;
        const entityData = JSON.stringify(event.databaseEntity, null, 2);

        auditLogger.info(
            `[DELETE] Entity "${entityName}" deleted:\n${entityData}`
        );
    }
}
