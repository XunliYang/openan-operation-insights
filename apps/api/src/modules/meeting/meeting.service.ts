import { Inject, Injectable } from '@nestjs/common';
import { MeetingAttendanceMatrix } from '../../contract/entities';
import { MEETING_ATTENDANCE_PORT } from '../../providers/tokens';
import { MeetingAttendancePort } from '../../providers/ports/meeting-attendance.port';

/**
 * 例会参会情况（ADR-0005）：无参数、无过滤、无分页、无聚合的纯透传。
 * 出席率与每场出席人数由前端按契约派生，接口不返回派生字段。
 */
@Injectable()
export class MeetingService {
  constructor(
    @Inject(MEETING_ATTENDANCE_PORT)
    private readonly attendance: MeetingAttendancePort,
  ) {}

  getMatrix(): Promise<MeetingAttendanceMatrix> {
    return this.attendance.getMatrix();
  }
}
