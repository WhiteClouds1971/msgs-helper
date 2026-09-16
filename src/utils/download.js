/**
 * 导出类接口的最后一公里 —— 把后端回的文件流存成文件。
 *
 * 接口回的是二进制内容（blob），不是能直接 window.open 的地址，所以这里现造一个
 * <a download> 再替用户点它一下：浏览器只肯下载「用户点过」的东西。
 */

/**
 * 存一份二进制内容为文件
 *
 * @param {Blob} blob 文件内容；null / undefined 直接跳过（拿不到内容时别造出个空文件）
 * @param {string} filename 含扩展名的文件名，中文也可以（编码交给浏览器）
 */
export function saveBlob(blob, filename) {
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // Firefox 要求 <a> 真的在文档里才认这次 click，用完立刻撤走
  document.body.appendChild(link);
  link.click();
  link.remove();

  // 撤早了会把下载掐断，等一拍再回收 —— 这串 URL 持有整份文件内容，别忘了撤
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * 导出文件名里的时间戳：yyyyMMdd-HHmm
 *
 * 同一天导两次不会互相覆盖，翻文件夹时也一眼看得出是哪次导的。
 *
 * @param {Date} [date] 取哪个时刻，默认现在
 * @returns {string} 形如 20260916-1743
 */
export function fileStamp(date = new Date()) {
  const pad = value => String(value).padStart(2, '0');
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}`
  );
}
