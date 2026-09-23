import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';
import { queryKeys } from './query-keys';
import type { MeetingAttendanceMatrix } from '@/types/contract';

/**
 * 例会参会矩阵：无参数、无过滤、无分页。
 * 出席率与每场出席人数由页面按契约派生（见 02 文档 §6）。
 */
export function useMeetingAttendance() {
  return useQuery({
    queryKey: queryKeys.meetings,
    queryFn: ({ signal }) => apiGet<MeetingAttendanceMatrix>('/meetings', { signal }),
  });
}
