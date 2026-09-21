import { Logger } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, basename } from 'node:path';
import { ErrorCode } from '../common/constants/error-code';
import { DomainException } from '../common/exceptions/domain.exception';

export interface JsonFileEnvelope<T> {
  schemaVersion: number;
  updatedAt: string;
  data: T;
}

export interface JsonRepositoryOptions<T> {
  /** 数据文件名，仅用于日志与定位（如 home.json） */
  fileName: string;
  /** 期望的 schemaVersion */
  schemaVersion: number;
  /** 结构校验守卫；失败即视为数据损坏 */
  isValidData: (value: unknown) => value is T;
}

/**
 * 泛型 JSON 仓储：
 * - 读：内存缓存 + 深拷贝返回（防外部污染）
 * - 写：临时文件 + rename 原子替换，按文件串行队列，避免半写与丢失更新
 * 见 03 文档 5.3 / 5.4。
 */
export class JsonRepository<T> {
  private readonly logger: Logger;
  private readonly filePath: string;
  private readonly options: JsonRepositoryOptions<T>;
  private cache: JsonFileEnvelope<T> | null = null;
  /** 每条记录一条写链，保证同一文件的写入串行 */
  private writeChain: Promise<unknown> = Promise.resolve();
  private degraded = false;

  constructor(filePath: string, options: JsonRepositoryOptions<T>) {
    this.filePath = filePath;
    this.options = options;
    this.logger = new Logger(`JsonRepository/${basename(filePath)}`);
  }

  get label(): string {
    return this.options.fileName;
  }

  /** 数据文件当前是否处于"损坏降级"状态 */
  get isDegraded(): boolean {
    return this.degraded;
  }

  async read(): Promise<JsonFileEnvelope<T>> {
    if (this.cache) {
      return structuredClone(this.cache);
    }

    const envelope = await this.readFromDisk();
    this.cache = envelope;
    return structuredClone(envelope);
  }

  async write(data: T): Promise<void> {
    return this.enqueue(async () => {
      const envelope: JsonFileEnvelope<T> = {
        schemaVersion: this.options.schemaVersion,
        updatedAt: new Date().toISOString(),
        data,
      };
      await this.writeToDisk(envelope);
      this.cache = envelope;
      this.degraded = false;
    });
  }

  async update(mutator: (current: T) => T): Promise<void> {
    return this.enqueue(async () => {
      const current = this.cache ?? (await this.readFromDisk());
      const next = mutator(structuredClone(current.data));
      const envelope: JsonFileEnvelope<T> = {
        schemaVersion: this.options.schemaVersion,
        updatedAt: new Date().toISOString(),
        data: next,
      };
      await this.writeToDisk(envelope);
      this.cache = envelope;
      this.degraded = false;
    });
  }

  invalidate(): void {
    this.cache = null;
  }

  /** 把任务追加到写链尾部，前序任务结束后才执行 */
  private enqueue<R>(task: () => Promise<R>): Promise<R> {
    const run = this.writeChain.then(task, task);
    // 保持链条不因单次失败而中断
    this.writeChain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private async readFromDisk(): Promise<JsonFileEnvelope<T>> {
    if (!existsSync(this.filePath)) {
      this.degraded = true;
      throw new DomainException(
        ErrorCode.DATA_CORRUPTED,
        `数据文件缺失：${this.options.fileName}，请确认 DATA_DIR 配置正确`,
      );
    }

    let raw: string;
    try {
      raw = await readFile(this.filePath, 'utf8');
    } catch (error) {
      this.degraded = true;
      this.logger.error(`读取 ${this.options.fileName} 失败：${(error as Error).message}`);
      throw new DomainException(ErrorCode.DATA_CORRUPTED, `数据文件读取失败：${this.options.fileName}`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      this.degraded = true;
      this.logger.error(`${this.options.fileName} JSON 解析失败：${(error as Error).message}`);
      throw new DomainException(ErrorCode.DATA_CORRUPTED, `数据文件不是合法 JSON：${this.options.fileName}`);
    }

    const envelope = this.assertEnvelope(parsed);
    this.logger.log(
      `loaded ${this.options.fileName} (${Array.isArray(envelope.data) ? envelope.data.length : 1} records)`,
    );
    this.degraded = false;
    return envelope;
  }

  private assertEnvelope(parsed: unknown): JsonFileEnvelope<T> {
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      this.degraded = true;
      throw new DomainException(ErrorCode.DATA_CORRUPTED, `${this.options.fileName} 顶层必须是对象`);
    }

    const envelope = parsed as Partial<JsonFileEnvelope<unknown>>;

    if (envelope.schemaVersion !== this.options.schemaVersion) {
      this.degraded = true;
      this.logger.error(
        `${this.options.fileName} schemaVersion 不匹配：期望 ${this.options.schemaVersion}，实际 ${String(envelope.schemaVersion)}`,
      );
      throw new DomainException(
        ErrorCode.DATA_CORRUPTED,
        `${this.options.fileName} 数据结构版本不兼容（期望 v${this.options.schemaVersion}）`,
      );
    }

    if (typeof envelope.updatedAt !== 'string' || Number.isNaN(Date.parse(envelope.updatedAt))) {
      this.degraded = true;
      throw new DomainException(ErrorCode.DATA_CORRUPTED, `${this.options.fileName} 缺少合法的 updatedAt`);
    }

    if (!this.options.isValidData(envelope.data)) {
      this.degraded = true;
      this.logger.error(`${this.options.fileName} data 结构校验未通过`);
      throw new DomainException(ErrorCode.DATA_CORRUPTED, `${this.options.fileName} 数据结构校验未通过`);
    }

    return envelope as JsonFileEnvelope<T>;
  }

  private async writeToDisk(envelope: JsonFileEnvelope<T>): Promise<void> {
    const dir = dirname(this.filePath);
    const tmpPath = join(dir, `.${this.options.fileName}.${process.pid}.${Date.now()}.tmp`);

    try {
      await mkdir(dir, { recursive: true });
      await writeFile(tmpPath, `${JSON.stringify(envelope, null, 2)}\n`, 'utf8');
      // rename 在同分区为原子操作，保证磁盘上永远不存在半截 JSON
      await rename(tmpPath, this.filePath);
      this.logger.log(`wrote ${this.options.fileName}`);
    } catch (error) {
      await rm(tmpPath, { force: true }).catch(() => undefined);
      this.logger.error(`写入 ${this.options.fileName} 失败：${(error as Error).message}`);
      throw new DomainException(ErrorCode.DATA_WRITE_FAILED, `数据写入失败：${this.options.fileName}`);
    }
  }
}
