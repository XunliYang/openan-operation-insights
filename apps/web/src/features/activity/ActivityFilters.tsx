import { Card } from '@/components/ui/Card';
import { DateInput, Field } from '@/components/ui/Field';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { IconFilter, IconRefresh } from '@/components/icons';
import type { Organization } from '@/types/contract';

export interface ActivityFilterState {
  orgIds: string[];
  from: string;
  to: string;
}

export interface ActivityFiltersProps {
  organizations: Organization[];
  value: ActivityFilterState;
  onChange: (next: ActivityFilterState) => void;
  onReset: () => void;
  /** 阶段一数据无时间维度，展示说明文案 */
  rangeHint?: string;
  isFetching?: boolean;
}

export function ActivityFilters({
  organizations,
  value,
  onChange,
  onReset,
  rangeHint,
  isFetching,
}: ActivityFiltersProps) {
  const options = organizations.map((org) => ({ value: org.orgId, label: org.name }));

  return (
    <Card className="reveal">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex items-center gap-2 pb-2.5 text-slate-400 lg:pb-2.5">
          <IconFilter width={16} height={16} />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            筛选
          </span>
        </div>

        <Field label="组织" className="lg:w-64">
          <MultiSelect
            options={options}
            value={value.orgIds}
            onChange={(orgIds) => onChange({ ...value, orgIds })}
            placeholder="全部组织"
          />
        </Field>

        <Field label="开始日期" className="lg:w-44">
          <DateInput
            value={value.from}
            max={value.to || undefined}
            onChange={(event) => onChange({ ...value, from: event.target.value })}
          />
        </Field>

        <Field label="结束日期" className="lg:w-44">
          <DateInput
            value={value.to}
            min={value.from || undefined}
            onChange={(event) => onChange({ ...value, to: event.target.value })}
          />
        </Field>

        <div className="flex items-center gap-2 lg:ml-auto">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-3.5 text-sm text-slate-200 transition hover:border-white/25 hover:bg-white/[0.08]"
          >
            <IconRefresh width={15} height={15} className={isFetching ? 'animate-spin' : undefined} />
            重置
          </button>
        </div>
      </div>

      {rangeHint ? (
        <p className="mt-4 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5 text-[0.72rem] leading-relaxed text-slate-500">
          口径说明：{rangeHint}
        </p>
      ) : null}
    </Card>
  );
}
