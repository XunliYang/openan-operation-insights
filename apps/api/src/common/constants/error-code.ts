import { HttpStatus } from '@nestjs/common';

/** 错误码表（见 03 文档 7.2） */
export enum ErrorCode {
  OK = 0,
  BAD_REQUEST = 40000,
  VALIDATION_FAILED = 40001,
  INVALID_DATE_RANGE = 40002,
  INVALID_YEAR = 40003,
  FORBIDDEN = 40300,
  WRITE_DISABLED = 40301,
  RESOURCE_NOT_FOUND = 40400,
  ORGANIZATION_NOT_FOUND = 40401,
  SUMMIT_NOT_FOUND = 40402,
  INTERNAL_ERROR = 50000,
  DATA_CORRUPTED = 50001,
  DATA_WRITE_FAILED = 50002,
  UPSTREAM_UNAVAILABLE = 50003,
  UPSTREAM_RATE_LIMITED = 50004,
}

export const ERROR_HTTP_STATUS: Record<ErrorCode, number> = {
  [ErrorCode.OK]: HttpStatus.OK,
  [ErrorCode.BAD_REQUEST]: HttpStatus.BAD_REQUEST,
  [ErrorCode.VALIDATION_FAILED]: HttpStatus.BAD_REQUEST,
  [ErrorCode.INVALID_DATE_RANGE]: HttpStatus.BAD_REQUEST,
  [ErrorCode.INVALID_YEAR]: HttpStatus.BAD_REQUEST,
  [ErrorCode.FORBIDDEN]: HttpStatus.FORBIDDEN,
  [ErrorCode.WRITE_DISABLED]: HttpStatus.FORBIDDEN,
  [ErrorCode.RESOURCE_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.ORGANIZATION_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.SUMMIT_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.INTERNAL_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ErrorCode.DATA_CORRUPTED]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ErrorCode.DATA_WRITE_FAILED]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ErrorCode.UPSTREAM_UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
  [ErrorCode.UPSTREAM_RATE_LIMITED]: HttpStatus.TOO_MANY_REQUESTS,
};

export const ERROR_DEFAULT_MESSAGE: Record<ErrorCode, string> = {
  [ErrorCode.OK]: 'ok',
  [ErrorCode.BAD_REQUEST]: '请求参数不合法',
  [ErrorCode.VALIDATION_FAILED]: '参数校验未通过',
  [ErrorCode.INVALID_DATE_RANGE]: '时间区间不合法：from 不能晚于 to',
  [ErrorCode.INVALID_YEAR]: '年份超出允许范围',
  [ErrorCode.FORBIDDEN]: '管理员令牌缺失或不匹配',
  [ErrorCode.WRITE_DISABLED]: '写接口未启用（MAP_WRITE_TOKEN 未配置），当前为只读',
  [ErrorCode.RESOURCE_NOT_FOUND]: '资源不存在',
  [ErrorCode.ORGANIZATION_NOT_FOUND]: '组织不存在',
  [ErrorCode.SUMMIT_NOT_FOUND]: '峰会不存在',
  [ErrorCode.INTERNAL_ERROR]: '服务内部错误',
  [ErrorCode.DATA_CORRUPTED]: '数据文件校验失败，数据维护中',
  [ErrorCode.DATA_WRITE_FAILED]: '数据写入失败',
  [ErrorCode.UPSTREAM_UNAVAILABLE]: '外部数据源暂不可用',
  [ErrorCode.UPSTREAM_RATE_LIMITED]: '外部数据源限流',
};
