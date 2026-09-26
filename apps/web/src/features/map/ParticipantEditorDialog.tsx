import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { useId } from 'react';
import { TextInput, Select } from '@/components/ui/Field';
import { ApiError, getAdminToken, setAdminToken } from '@/lib/api-client';
import { useUpsertMapMarker } from '@/hooks/useMapSources';
import { cn } from '@/lib/cn';
import type { MapMarker, MapSource, ParticipantCategory, UpsertMarkerBody } from '@/types/contract';
import { categoryOptions } from './participant-categories';
import { PARTICIPANT_COPY } from './participant-copy';
import { MarkerMap } from './MarkerMap';

export interface ParticipantEditorDialogProps {
  source: MapSource;
  /** 编辑目标；null = 新增模式 */
  marker: MapMarker | null;
  writable: boolean;
  onClose: () => void;
  /** 保存成功后回传 markerId（新增 / 编辑都是最终 markerId） */
  onSaved: (markerId: string) => void;
}

const INPUT_CLASSES =
  'h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-slate-100 transition ' +
  'placeholder:text-slate-500 hover:border-white/20 hover:bg-white/[0.06] focus:border-brand-400/60 focus:bg-white/[0.07] ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:cursor-not-allowed disabled:opacity-60';

const TEXTAREA_CLASSES = INPUT_CLASSES.replace('h-10', 'min-h-20') + ' py-2';

/** 由名称生成 kebab-case 默认 markerId（与后端 `/^[a-z0-9][a-z0-9-]{1,63}$/` 对齐） */
function kebabCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

/** 中文标签 + 必填星号 + 字段级错误 */
function FormField({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">
        {label}
        {required ? <span className="text-rose-300"> *</span> : null}
      </span>
      {children}
      {error ? (
        <span className="text-[0.72rem] leading-snug text-rose-300">{error}</span>
      ) : hint ? (
        <span className="text-[0.7rem] text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}

function roundCoord(value: string): string {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(5) : value;
}

/** 手动添加 / 编辑参与方的受控表单弹层（无第三方表单库） */
export function ParticipantEditorDialog({
  source,
  marker,
  writable,
  onClose,
  onSaved,
}: ParticipantEditorDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const upsert = useUpsertMapMarker();

  const [isUpdate, setIsUpdate] = useState(marker !== null);
  const [label, setLabel] = useState(marker?.label ?? '');
  const [category, setCategory] = useState<ParticipantCategory>(marker?.category ?? 'other');
  const [countryName, setCountryName] = useState(marker?.countryName ?? '');
  const [countryCode, setCountryCode] = useState(marker?.countryCode ?? '');
  const [longitude, setLongitude] = useState(marker ? String(marker.longitude) : '');
  const [latitude, setLatitude] = useState(marker ? String(marker.latitude) : '');
  const [locationLabel, setLocationLabel] = useState(marker?.locationLabel ?? '');
  const [homepageUrl, setHomepageUrl] = useState(marker?.homepageUrl ?? '');
  const [logoUrl, setLogoUrl] = useState(marker?.logoUrl ?? '');
  const [description, setDescription] = useState(marker?.description ?? '');
  const [markerId, setMarkerId] = useState(marker?.markerId ?? '');
  const [markerIdTouched, setMarkerIdTouched] = useState(marker !== null);
  const [selectedExisting, setSelectedExisting] = useState('');
  const [pickMode, setPickMode] = useState(false);
  const [token, setToken] = useState(() => getAdminToken() ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const existingOptions = useMemo(
    () =>
      [...source.markers]
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((m) => ({ value: m.markerId, label: m.label })),
    [source.markers],
  );

  // 初始焦点 + Esc 关闭 + Tab 焦点锁
  useEffect(() => {
    firstFieldRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const container = dialogRef.current;
      if (!container) return;
      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey) {
        if (active === first || !container.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !container.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleLabelChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setLabel(next);
    if (!markerIdTouched && !isUpdate) setMarkerId(kebabCase(next));
  };

  const handleMarkerIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMarkerIdTouched(true);
    setMarkerId(event.target.value);
  };

  const handleTokenChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setToken(next);
    setAdminToken(next);
  };

  const handleSelectExisting = (event: ChangeEvent<HTMLSelectElement>) => {
    const id = event.target.value;
    if (!id) return;
    const existing = source.markers.find((m) => m.markerId === id);
    if (!existing) return;
    setSelectedExisting(id);
    setMarkerId(existing.markerId);
    setMarkerIdTouched(true);
    setIsUpdate(true);
    setLabel(existing.label);
    setCategory(existing.category);
    setCountryName(existing.countryName);
    setCountryCode(existing.countryCode);
    setLongitude(String(existing.longitude));
    setLatitude(String(existing.latitude));
    setLocationLabel(existing.locationLabel ?? '');
    setHomepageUrl(existing.homepageUrl ?? '');
    setLogoUrl(existing.logoUrl ?? '');
    setDescription(existing.description ?? '');
    setErrors({});
    setServerError(null);
  };

  const handlePickPoint = (point: { longitude: number; latitude: number }) => {
    setLongitude(roundCoord(String(point.longitude)));
    setLatitude(roundCoord(String(point.latitude)));
    setPickMode(false);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.longitude;
      delete next.latitude;
      return next;
    });
  };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};

    const labelTrimmed = label.trim();
    if (!labelTrimmed) errs.label = PARTICIPANT_COPY.vLabelRequired;
    else if (labelTrimmed.length > 80) errs.label = PARTICIPANT_COPY.vLabelTooLong;

    const countryNameTrimmed = countryName.trim();
    if (!countryNameTrimmed) errs.countryName = PARTICIPANT_COPY.vCountryNameRequired;
    else if (countryNameTrimmed.length > 64) errs.countryName = PARTICIPANT_COPY.vCountryNameTooLong;

    const code = countryCode.trim().toUpperCase();
    if (!code) errs.countryCode = PARTICIPANT_COPY.vCountryCodeRequired;
    else if (!/^[A-Z]{2}$/.test(code)) errs.countryCode = PARTICIPANT_COPY.vCountryCodeFormat;

    const lon = Number(longitude);
    if (longitude.trim() === '') errs.longitude = PARTICIPANT_COPY.vLongitudeRequired;
    else if (!Number.isFinite(lon) || lon < -180 || lon > 180)
      errs.longitude = PARTICIPANT_COPY.vLongitudeRange;

    const lat = Number(latitude);
    if (latitude.trim() === '') errs.latitude = PARTICIPANT_COPY.vLatitudeRequired;
    else if (!Number.isFinite(lat) || lat < -90 || lat > 90)
      errs.latitude = PARTICIPANT_COPY.vLatitudeRange;

    if (homepageUrl.trim() && !/^https?:\/\//.test(homepageUrl.trim())) {
      errs.homepageUrl = PARTICIPANT_COPY.vHomepageInvalid;
    }

    const logo = logoUrl.trim();
    if (logo && !/^(?:https?:\/\/|\/)/.test(logo)) {
      errs.logoUrl = PARTICIPANT_COPY.vLogoInvalid;
    }

    if (!isUpdate) {
      const id = markerId.trim();
      if (!id) errs.markerId = PARTICIPANT_COPY.vMarkerIdRequired;
      else if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(id)) errs.markerId = PARTICIPANT_COPY.vMarkerIdFormat;
    }

    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const body: UpsertMarkerBody = {
      label: label.trim(),
      category,
      countryName: countryName.trim(),
      countryCode: countryCode.trim().toUpperCase(),
      longitude: Number(longitude),
      latitude: Number(latitude),
      ...(locationLabel.trim() ? { locationLabel: locationLabel.trim() } : {}),
      ...(homepageUrl.trim() ? { homepageUrl: homepageUrl.trim() } : {}),
      ...(logoUrl.trim() ? { logoUrl: logoUrl.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(marker?.orgId !== undefined && marker.orgId !== null ? { orgId: marker.orgId } : {}),
    };

    setServerError(null);
    try {
      await upsert.mutateAsync({
        sourceId: source.sourceId,
        markerId: markerId.trim(),
        body,
        isUpdate,
      });
      onSaved(markerId.trim());
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 40300) setServerError(PARTICIPANT_COPY.errAdminToken);
        else if (error.code === 40301) setServerError(PARTICIPANT_COPY.errWriteDisabled);
        else if (error.code === 40001)
          setServerError(error.message ? `${PARTICIPANT_COPY.errField}：${error.message}` : PARTICIPANT_COPY.errField);
        else setServerError(error.message || PARTICIPANT_COPY.errDefault);
      } else {
        setServerError(PARTICIPANT_COPY.errDefault);
      }
    }
  };

  const saving = upsert.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0b0f1d] p-6 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)]"
      >
        <div className="mb-5">
          <h2 id={titleId} className="text-lg font-semibold text-white">
            {isUpdate ? PARTICIPANT_COPY.formTitleEdit : PARTICIPANT_COPY.formTitleAdd}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            {isUpdate ? PARTICIPANT_COPY.formDescriptionEdit : PARTICIPANT_COPY.formDescriptionAdd}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label={PARTICIPANT_COPY.fieldLabel}
            required
            error={errors.label}
            children={
              <input
                ref={firstFieldRef}
                value={label}
                onChange={handleLabelChange}
                placeholder={PARTICIPANT_COPY.fieldLabelPlaceholder}
                className={INPUT_CLASSES}
              />
            }
          />
          <FormField
            label={PARTICIPANT_COPY.fieldCategory}
            error={errors.category}
            children={
              <Select
                value={category}
                onChange={(event) => setCategory(event.target.value as ParticipantCategory)}
              >
                {categoryOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            }
          />
          <FormField
            label={PARTICIPANT_COPY.fieldCountryName}
            required
            error={errors.countryName}
            children={
              <input
                value={countryName}
                onChange={(event) => setCountryName(event.target.value)}
                className={INPUT_CLASSES}
              />
            }
          />
          <FormField
            label={PARTICIPANT_COPY.fieldCountryCode}
            required
            hint={PARTICIPANT_COPY.fieldCountryCodeHint}
            error={errors.countryCode}
            children={
              <input
                value={countryCode}
                onChange={(event) => setCountryCode(event.target.value.toUpperCase())}
                maxLength={2}
                className={INPUT_CLASSES}
              />
            }
          />
          <FormField
            label={PARTICIPANT_COPY.fieldLongitude}
            required
            error={errors.longitude}
            children={
              <input
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
                inputMode="decimal"
                className={INPUT_CLASSES}
              />
            }
          />
          <FormField
            label={PARTICIPANT_COPY.fieldLatitude}
            required
            error={errors.latitude}
            children={
              <input
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
                inputMode="decimal"
                className={INPUT_CLASSES}
              />
            }
          />
          <FormField
            label={PARTICIPANT_COPY.fieldLocationLabel}
            error={errors.locationLabel}
            children={
              <input
                value={locationLabel}
                onChange={(event) => setLocationLabel(event.target.value)}
                className={INPUT_CLASSES}
              />
            }
          />
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setPickMode((prev) => !prev)}
              aria-pressed={pickMode}
              className={cn(
                'inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium transition',
                pickMode
                  ? 'border-accent-400/50 bg-accent-500/[0.12] text-accent-200'
                  : 'border-white/12 bg-white/[0.04] text-slate-200 hover:border-white/25 hover:bg-white/[0.08]',
              )}
            >
              {pickMode ? PARTICIPANT_COPY.pickFromMapActive : PARTICIPANT_COPY.pickFromMap}
            </button>
          </div>
          <FormField
            label={PARTICIPANT_COPY.fieldHomepageUrl}
            error={errors.homepageUrl}
            children={
              <input
                value={homepageUrl}
                onChange={(event) => setHomepageUrl(event.target.value)}
                placeholder="https://"
                className={INPUT_CLASSES}
              />
            }
          />
          <FormField
            label={PARTICIPANT_COPY.fieldLogoUrl}
            error={errors.logoUrl}
            children={
              <input
                value={logoUrl}
                onChange={(event) => setLogoUrl(event.target.value)}
                placeholder="/logos/…"
                className={INPUT_CLASSES}
              />
            }
          />
          <div className="sm:col-span-2">
            <FormField
              label={PARTICIPANT_COPY.fieldDescription}
              error={errors.description}
              children={
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  className={TEXTAREA_CLASSES}
                />
              }
            />
          </div>
          <div className="sm:col-span-2">
            <FormField
              label={PARTICIPANT_COPY.fieldMarkerId}
              hint={isUpdate ? undefined : PARTICIPANT_COPY.fieldMarkerIdHint}
              error={errors.markerId}
              children={
                <input
                  value={markerId}
                  onChange={handleMarkerIdChange}
                  disabled={isUpdate}
                  className={cn(INPUT_CLASSES, isUpdate && 'cursor-not-allowed bg-white/[0.02] opacity-60')}
                />
              }
            />
          </div>
        </div>

        {/* 取点地图 */}
        {pickMode ? (
          <div className="mt-4 rounded-xl border border-accent-400/40">
            <MarkerMap
              source={source}
              pickMode
              onPickPoint={handlePickPoint}
              height={260}
              zoomControls={false}
              ariaLabel={PARTICIPANT_COPY.mapPickAria}
            />
          </div>
        ) : null}

        {/* 从已有参与方选择（仅新增模式） */}
        {!isUpdate ? (
          <div className="mt-4">
            <FormField
              label={PARTICIPANT_COPY.selectExisting}
              hint={PARTICIPANT_COPY.selectExistingHint}
              children={
                <Select value={selectedExisting} onChange={handleSelectExisting}>
                  <option value="">{PARTICIPANT_COPY.selectExistingPlaceholder}</option>
                  {existingOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              }
            />
          </div>
        ) : null}

        {/* 管理员令牌（仅写入前需要，只存 sessionStorage） */}
        {writable ? (
          <div className="mt-4">
            <FormField
              label={PARTICIPANT_COPY.adminToken}
              children={
                <TextInput
                  type="password"
                  value={token}
                  onChange={handleTokenChange}
                  placeholder={PARTICIPANT_COPY.adminTokenPlaceholder}
                />
              }
            />
          </div>
        ) : null}

        {serverError ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200"
          >
            {serverError}
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-4 text-sm font-medium text-slate-200 transition hover:border-white/25 hover:bg-white/[0.08] disabled:opacity-50"
          >
            {PARTICIPANT_COPY.cancel}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-4 text-sm font-medium text-white transition hover:from-brand-400 hover:to-brand-500 disabled:opacity-60"
          >
            {saving ? PARTICIPANT_COPY.saving : PARTICIPANT_COPY.save}
          </button>
        </div>
      </div>
    </div>
  );
}