import { ObjectType, Field } from '@nestjs/graphql';
import { Task } from '../entities/task.entity';
import { SubscriptionEvent } from '../../../common/enums/task.enum';

@ObjectType()
export class TaskSubscriptionPayload {
  @Field()
  event: string;

  @Field(() => Task)
  task: Task;
}

@ObjectType()
export class CommentSubscriptionPayload {
  @Field()
  projectId: string;

  @Field()
  taskId: string;
}
