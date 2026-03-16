import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { TaskColumn } from './entities/task-column.entity';
import { Comment } from './entities/comment.entity';
import { Attachment } from './entities/attachment.entity';
import { TasksService } from './tasks.service';
import { TasksResolver } from './tasks.resolver';
import { ProjectsModule } from '../projects/projects.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskColumn, Comment, Attachment]),
    ProjectsModule,
    NotificationsModule,
    UsersModule,
  ],
  providers: [TasksService, TasksResolver],
  exports: [TasksService],
})
export class TasksModule {}
