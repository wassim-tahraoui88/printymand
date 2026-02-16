import {
    DeleteResult,
    Document,
    FilterQuery,
    Model,
    ProjectionType, type Require_id,
    RootFilterQuery,
    Types,
    UpdateQuery,
} from 'mongoose';
import { PaginationOptions } from '../pagination-options.dto';

export class BaseRepository<T> {

    constructor(protected model: Model<T & Document>, protected populations: string[], protected defaultParams: Record<string,any> = { sortBy: 'id', sortOrder: 'asc' }) {}

    async save(data: Partial<T>): Promise<T | null> {
        const object = await this.model.create(data);
        return (await (object as Document<T>).populate(this.populations)).toObject();
    }

    async findAll(queryParams: PaginationOptions, select?: ProjectionType<T>) : Promise<(Require_id<T & Document> & { __v : number; })[]> {
        let query = this.model.find(queryParams.filter || {}, select);
        query = query.sort({ [queryParams.sortBy || this.defaultParams.sortBy]: queryParams.sortOrder || this.defaultParams.sortOrder });
        if (queryParams.page != null) query = query.skip(queryParams.page * (queryParams.size || 10));
        if (queryParams.size != null) query = query.limit(queryParams.size);
        return (await query.populate(this.populations).exec()).map(x => x.toObject());
    }
    async findById(id: string): Promise<T | undefined> {
        return (await this.model.findById(id).populate(this.populations).exec())?.toObject();
    }
    async findOne(filter: RootFilterQuery<T>): Promise<T | undefined> {
        return (await this.model.findOne(filter).populate(this.populations).exec())?.toObject();
    }

    async update(id: string, data: UpdateQuery<T & Document>): Promise<T | undefined> {
        return (await this.model.findByIdAndUpdate(id, data, { new: true }))?.toObject();
    }
    async updateOne(filter: RootFilterQuery<T>, data: UpdateQuery<T & Document>): Promise<T | undefined> {
        return (await this.model.findOneAndUpdate(filter, data, { new: true }))?.toObject();
    }
    async updateMany(filter: RootFilterQuery<T>, data: UpdateQuery<T & Document>): Promise<boolean> {
        return (await this.model.updateMany(filter, data).exec()).modifiedCount > 0;
    }

    async deleteById(id: string): Promise<T | null> {
        return await this.model.findByIdAndDelete(id).exec();
    }
    async deleteOne(filter: RootFilterQuery<T>): Promise<T | null> {
        return await this.model.findOneAndDelete(filter).exec();
    }
    async deleteMany(filter: RootFilterQuery<T>): Promise<DeleteResult> {
        return await this.model.deleteMany(filter).exec();
    }

    async existsById(id : string): Promise<boolean> {
        const check = await this.model.exists({ _id: id } as FilterQuery<T>);
        return check !== null;
    }

    async count(): Promise<number> {
        return await this.model.countDocuments().exec();
    }
    async countBy(filter: RootFilterQuery<T>): Promise<number> {
        return await this.model.countDocuments(filter).exec();
    }
}