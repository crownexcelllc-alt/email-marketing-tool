import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppException } from '../../common/exceptions/app.exception';
import { WorkspaceRole } from '../workspaces/constants/workspace-role.enum';
import { User, UserDocument } from './schemas/user.schema';

interface CreateUserInput {
  fullName: string;
  email: string;
  passwordHash: string;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  health(): { module: string; status: string; next: string } {
    return {
      module: 'users',
      status: 'ready',
      next: 'Users persistence layer is active.',
    };
  }

  async createUser(input: CreateUserInput): Promise<UserDocument> {
    return this.userModel.create(input);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+passwordHash').exec();
  }

  async findById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).exec();
  }

  async assignDefaultWorkspace(
    userId: string,
    workspaceId: string,
    role: WorkspaceRole,
  ): Promise<UserDocument | null> {
    const workspaceObjectId = this.toObjectId(workspaceId, 'INVALID_WORKSPACE_ID');

    return this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $set: { defaultWorkspaceId: workspaceObjectId },
          $addToSet: {
            workspaces: {
              workspaceId: workspaceObjectId,
              role,
            },
          },
        },
        { new: true },
      )
      .exec();
  }

  async deleteById(userId: string): Promise<void> {
    await this.userModel.findByIdAndDelete(userId).exec();
  }

  private toObjectId(id: string, code: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppException(HttpStatus.BAD_REQUEST, code, 'Invalid ObjectId provided');
    }

    return new Types.ObjectId(id);
  }
}
