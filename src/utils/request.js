import axios from 'axios';

import { useMessage } from '@/composables/useMessage';

/**
 * axios 实例 —— 全站唯一的请求出口。三条约定都收在这里，换后端只改这个文件：
 *
 * · 地址：APP_SERVER_URL + APP_BASE_API（见 .env*）。dev 下 APP_SERVER_URL 留空，
 *   请求发到同源的 /api，由 Vite 代理转给后端（vite.config.js 的 server.proxy）；
 *   生产同理由 nginx 转发。两边请求 URL 一致，业务代码不用分环境。
 * · 响应：后端统一响应体 { code, message, data }（对应 server 的 common/Result.java）。
 *   code === 0 时 resolve 出 data —— 调用方拿到的是业务数据本身，不用再 .data.data；
 *   code !== 0 或请求本身失败时 reject，并弹一条错误提示。
 * · 提示：默认自动弹错；某个请求不想弹就传 config.silent = true，自己接管。
 *
 * 用法：
 *   import request from '@/utils/request';
 *   const data = await request.get('/ping');
 */

/** 后端约定：0 = 成功 */
const CODE_SUCCESS = 0;

/** 超时（ms）—— 面杀现场网络未必好，给宽一点 */
const TIMEOUT = 10000;

const instance = axios.create({
  baseURL: `${import.meta.env.APP_SERVER_URL ?? ''}${import.meta.env.APP_BASE_API ?? ''}`,
  timeout: TIMEOUT,
});

/**
 * 弹错误提示
 * @param {object} config 该次请求的配置（读它的 silent）
 * @param {string} message 提示文案
 */
function notify(config, message) {
  if (config?.silent) return;
  useMessage().error(message);
}

/**
 * 把 axios 的错误翻成一句人话
 * @param {import('axios').AxiosError} error
 * @returns {string}
 */
function describeError(error) {
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return '请求超时，请稍后再试';
  }
  // 压根没收到响应：断网、后端没起、被代理挡了
  if (!error.response) return '网络异常，请检查网络后重试';

  const { status } = error.response;
  if (status === 404) return '接口不存在';
  if (status >= 500) return '服务器开小差了，请稍后再试';
  return `请求失败（${status}）`;
}

/* 请求拦截：眼下无事可做（登录态等以后再说），先留出入口 ——
   以后加 token 只动这里，不用回头改调用方 */
instance.interceptors.request.use(config => config);

instance.interceptors.response.use(
  response => {
    const body = response.data;

    // 统一响应体：按 code 判成败，成功只把 data 交出去
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code === CODE_SUCCESS) return body.data;
      const message = body.message || '请求失败';
      notify(response.config, message);
      return Promise.reject(new Error(message));
    }

    // 不是统一响应体（文件流、第三方接口）：原样交出去
    return body;
  },
  error => {
    // 后端 5xx 走的是 GlobalExceptionHandler，同样带统一响应体，优先用它给的文案
    const message = error.response?.data?.message || describeError(error);
    notify(error.config, message);
    return Promise.reject(new Error(message));
  }
);

export default instance;
