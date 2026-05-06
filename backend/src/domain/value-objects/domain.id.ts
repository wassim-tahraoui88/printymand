import { isUUID } from 'class-validator';
import { v7 } from 'uuid';

abstract class DomainId {
    protected constructor(readonly value: UUID) {}
    toString() {
        return this.value;
    }
    equals(other: DomainId) {
        return this.value === other.value;
    }
}

export function createDomainIdClass(name: string) {
    return class extends DomainId {
        protected constructor(value: UUID) {
            super(value);
        }

        static create(value: UUID) {
            if (!isUUID(value)) {
                throw new Error(`Invalid ${ name }`);
            }
            return new this(value);
        }
        static generate() {
            return new this(v7());
        }
    };
}

export class EntityId extends createDomainIdClass('EntityId') {}
