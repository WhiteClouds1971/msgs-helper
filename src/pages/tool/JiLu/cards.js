/**
 * 记录页的值域 —— 单一事实源
 *
 * 三组牌名（基本 / 锦囊 / 装备）就是牌池里能记的东西；花色与点数是复杂模式
 * 记具体牌时要挑的两样。改这里即改页面，页面里不再出现第二份牌名清单。
 *
 * 每张牌都是 { code, label }：code 是稳定标识（落盘与计数都认它，改名不动已存数据），
 * label 是牌面文字。装备牌名里的「+1 / -1」是坐骑的距离修正，照牌面原样带着。
 *
 * 花色给三样：pip 字形、label 读法、tone 牌色。字形用的是牌桌上的通用记号
 * （♠ ♥ ♣ ♦，U+2660/2665/2663/2666）并加了 U+FE0E 变体选择符，把它钉在
 * 「文字表现」上 —— 不然有些设备会拿彩色 emoji 去顶它。牌色分两路：黑桃梅花
 * 是浓墨，红桃方片是朱砂，都落在设计系统的 token 上。
 */

/** 牌池：三组牌名，页面按这个顺序铺开 */
export const CARD_GROUPS = Object.freeze([
  {
    key: 'jin-ben',
    title: '基本牌',
    cards: Object.freeze([
      { code: 'HuoSha', label: '火杀' },
      { code: 'LeiSha', label: '雷杀' },
      { code: 'Sha', label: '杀' },
      { code: 'Shan', label: '闪' },
      { code: 'Tao', label: '桃' },
      { code: 'Jiu', label: '酒' },
    ]),
  },
  {
    key: 'jin-nang',
    title: '锦囊牌',
    cards: Object.freeze([
      { code: 'WuXieKeJi', label: '无懈可击' },
      { code: 'WuZhongShengYou', label: '无中生有' },
      { code: 'ShunShouQianYang', label: '顺手牵羊' },
      { code: 'GuoHeChaiQiao', label: '过河拆桥' },
      { code: 'TieSuoLianHuan', label: '铁索连环' },
      { code: 'WuGuFengDeng', label: '五谷丰登' },
      { code: 'JieDaoShaRen', label: '借刀杀人' },
      { code: 'TaoYuanJieYi', label: '桃园结义' },
      { code: 'NanManRuQin', label: '南蛮入侵' },
      { code: 'WanJianQiFa', label: '万箭齐发' },
      { code: 'JueDou', label: '决斗' },
      { code: 'HuoGong', label: '火攻' },
      { code: 'LeBuSiShu', label: '乐不思蜀' },
      { code: 'BingLiangCunDuan', label: '兵粮寸断' },
      { code: 'ShanDian', label: '闪电' },
      { code: 'QiZhengXiangSheng', label: '奇正相生' },
      { code: 'ChuQiBuYi', label: '出其不意' },
      { code: 'TuiXinZhiFu', label: '推心置腹' },
      { code: 'ChenHuoDaJie', label: '趁火打劫' },
    ]),
  },
  {
    key: 'zhuang-bei',
    title: '装备牌',
    cards: Object.freeze([
      { code: 'HanBingJian', label: '寒冰剑' },
      { code: 'GuDingDao', label: '古锭刀' },
      { code: 'QiLinGong', label: '麒麟弓' },
      { code: 'ZhuQueYuShan', label: '朱雀羽扇' },
      { code: 'QingHongJian', label: '青虹剑' },
      { code: 'FangTianHuaJi', label: '方天画戟' },
      { code: 'ZhangBaSheMao', label: '丈八蛇矛' },
      { code: 'QingLongYanYueDao', label: '青龙偃月刀' },
      { code: 'ZhuGeLianNu', label: '诸葛连弩' },
      { code: 'GuanShiFu', label: '贯石斧' },
      { code: 'CiXiongShuangGuJian', label: '雌雄双股剑' },
      { code: 'TengJia', label: '藤甲' },
      { code: 'RenWangDun', label: '仁王盾' },
      { code: 'BaGuaZhen', label: '八卦阵' },
      { code: 'BaiYinShiZi', label: '白银狮子' },
      { code: 'JueYingPlus1', label: '绝影+1' },
      { code: 'DiLuPlus1', label: '的卢+1' },
      { code: 'ZhuaHuangFeiLeiPlus1', label: '爪黄飞雷+1' },
      { code: 'HuaLiuPlus1', label: '骅骝+1' },
      { code: 'ChiTuMinus1', label: '赤兔-1' },
      { code: 'DaWanMinus1', label: '大宛-1' },
      { code: 'ZiXingMinus1', label: '紫骍-1' },
      { code: 'MuNiuLiuMa', label: '木牛流马' },
    ]),
  },
]);

/**
 * 默认展开的那一折（key 取 CARD_GROUPS 里的一个）
 *
 * 锦囊牌最常记（无中生有、顺手牵羊、过河拆桥…），进来就摊着；
 * 基本牌与装备牌默认收着，记哪一类再展开哪一类。
 */
export const DEFAULT_OPEN_GROUP = 'jin-nang';

/** 花色：key 落盘，pip 画角标，label 只喂读屏 */
export const SUITS = Object.freeze([
  { key: 'hei-tao', label: '黑桃', pip: '♠︎', tone: 'ink' },
  { key: 'hong-tao', label: '红桃', pip: '♥︎', tone: 'red' },
  { key: 'mei-hua', label: '梅花', pip: '♣︎', tone: 'ink' },
  { key: 'fang-pian', label: '方片', pip: '♦︎', tone: 'red' },
]);

/** 按 key 取花色（记录列表渲染时用） */
export const SUIT_BY_KEY = Object.freeze(
  Object.fromEntries(SUITS.map(suit => [suit.key, suit])),
);

/** 点数：A 到 K，与牌面顺序一致 */
export const RANKS = Object.freeze([
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
]);
