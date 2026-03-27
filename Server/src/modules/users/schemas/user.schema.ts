import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import {
  WORKSPACE_ROLE_VALUES,
  WorkspaceRole,
} from '../../workspaces/constants/workspace-role.enum';

@Schema({ _id: false })
export class UserWorkspaceRole {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Workspace', required: true })
  workspaceId!: Types.ObjectId;

  @Prop({ required: true, enum: WORKSPACE_ROLE_VALUES })
  role!: WorkspaceRole;
}

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, trim: true, minlength: 2, maxlength: 120 })
  fullName!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ type: [String], default: [] })
  roles!: string[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Workspace', default: null })
  defaultWorkspaceId!: Types.ObjectId | null;

  @Prop({ type: [UserWorkspaceRole], default: [] })
  workspaces!: UserWorkspaceRole[];
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
