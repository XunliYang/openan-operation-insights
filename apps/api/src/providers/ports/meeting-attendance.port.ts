import { MeetingAttendanceMatrix } from '../../contract/entities';

export type { MeetingAttendanceMatrix, MeetingAttendanceRow } from '../../contract/entities';

/**
 * 例会参会矩阵端口（ADR-0005，见 03 文档 §4.5）。
 *
 * 纯透传：不排序、不聚合、不改写列名。台账由采集脚本
 * （scripts/import-meetings.ts）落盘，接口侧恒为 JSON 读实现。
 */
export interface MeetingAttendancePort {
  getMatrix(): Promise<MeetingAttendanceMatrix>;
}
