package com.msgshelper.server.dto;

/**
 * 记一局 / 登记归属 的请求体。
 *
 * @param mode   模式，取前端 MODES 的 value：dou-di-zhu / jun-zheng / tuan-zhan
 * @param pool   将池
 * @param hero   武将
 * @param role   身份（斗地主、军争）或位置（团战），取前端各模式表单的 value；可不填
 * @param result 对局结果：win / lose；可不填
 */
public record JiangChiRecordRequest(String mode, String pool, String hero, String role, String result) {
}
