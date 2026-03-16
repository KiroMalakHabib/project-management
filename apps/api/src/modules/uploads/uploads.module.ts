import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from '../tasks/entities/attachment.entity';
import { UploadsService } from './uploads.service';
import { UploadsResolver } from './uploads.resolver';
import { ProjectsModule } from '../projects/projects.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attachment]),
    ProjectsModule,
    TasksModule,
  ],
  providers: [UploadsService, UploadsResolver],
  exports: [UploadsService],
})
export class UploadsModule {}
