import { Inject, Injectable } from '@nestjs/common';
import { MeetingAttendanceMatrix } from '../../contract/entities';
import { JsonRepository } from '../../repositories/json-repository';
import { MEETINGS_REPOSITORY } from '../../repositories/repository.tokens';
import { MeetingAttendancePort } from '../ports/meeting-attendance.port';

/**
 * 例会参会矩阵的 JSON 实现：原样返回落盘矩阵。
 * 仓储 read() 已返回深拷贝，且写入前经 isMeetingAttendanceMatrix 校验，
 * 因此这里不再做二次加工（纯透传，见 03 文档 §4.5）。
 */
@Injectable()
export class JsonMeetingAttendanceProvider implements MeetingAttendancePort {
  constructor(
    @Inject(MEETINGS_REPOSITORY)
    private readonly repository: JsonRepository<MeetingAttendanceMatrix>,
  ) {}

  async getMatrix(): Promise<MeetingAttendanceMatrix> {
    const { data } = await this.repository.read();
    return data;
  }
}
