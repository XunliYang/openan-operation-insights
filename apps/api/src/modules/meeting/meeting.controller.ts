import { Controller, Get } from '@nestjs/common';
import { MeetingAttendanceMatrix } from '../../contract/entities';
import { MeetingService } from './meeting.service';

@Controller('meetings')
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  /** GET /api/meetings —— 例会参会矩阵（无参数，透传台账原序） */
  @Get()
  getMatrix(): Promise<MeetingAttendanceMatrix> {
    return this.meetingService.getMatrix();
  }
}
