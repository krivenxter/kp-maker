const ROOT = '/icons/essentials';

const iconNames: Record<string, string> = {
  calltracking: 'call',
  'static-calltracking': 'call-incoming',
  'email-tracking': 'send-2',
  tagging: 'tag',
  cdp: 'hierarchy-2',
  'voice-target': 'call-outgoing',
  programmatic: 'monitor-mobbile',
  'media-format': 'video-play',
  dooh: 'monitor',
  'ai-operator': 'cpu',
  sms: 'sms',
  'targeted-sms': 'send-2',
  callback: 'call-incoming',
  'autodial-site': 'call-outgoing',
  'autodial-list': 'call-outgoing',
  'autodial-missed': 'refresh-2',
  'autodial-lead-form': 'call-outgoing',
  'promo-widgets': 'element-plus',
  'promo-landing': 'monitor-mobbile',
  'promo-link': 'link',
  'promo-banner': 'gallery',
  'smart-request': 'clipboard-tick',
  multibutton: 'element-plus',
  'wheel-of-fortune': 'discount-shape',
  'trade-in': 'car',
  marquiz: 'document',
  'online-chat': 'message',
  'max-chat': 'message',
  'vk-chat': 'message',
  'telegram-chat': 'message',
  analytics: 'graph',
  predict: 'diagram',
  scoring: 'verify',
  'big-data': '3d-cube-scan',
  'ai-assistant': 'cpu',
};

export function productIconPath(productId: string, fallback?: string): string {
  const name = iconNames[productId];
  return name ? `${ROOT}/icons-${name}.svg` : fallback ?? `${ROOT}/icons-element-plus.svg`;
}

const flowIconNames = [
  'call', 'mobile', 'send-2', 'sms', 'message', 'monitor', 'monitor-mobbile', 'clipboard-tick',
  'user', 'people', 'hierarchy-2', 'graph', 'moneys', 'tag', 'cpu', 'discount-shape', 'car',
  'cloud-connection', 'clock', 'location', 'verify', 'share', 'link',
];

export const FLOW_ICON_PATHS = flowIconNames.map((name) => `${ROOT}/icons-${name}.svg`);

export function flowIconPath(title: string, description: string, productId: string): string {
  const label = title.toLocaleLowerCase('ru');
  const directName = /единое окно/.test(label) ? 'monitor'
    : /полный путь/.test(label) ? 'link'
      : /коллтрекинг/.test(label) ? 'call'
        : /roi|дрр|выруч|продаж|оплат|покуп/.test(label) ? 'moneys'
    : /crm|сделк/.test(label) ? 'hierarchy-2'
      : /аналит|отч[её]т|статист|окупаем|метрик/.test(label) ? 'graph'
        : /реклам|кампан|показ|медийн|экран/.test(label) ? 'monitor'
          : /звон|дозвон|разговор|обращение/.test(label) ? 'call'
            : /email|почт|письм/.test(label) ? 'send-2'
              : /смс/.test(label) ? 'sms'
                : /путь|канал|источник/.test(label) ? 'share'
                  : undefined;
  if (directName) return `${ROOT}/icons-${directName}.svg`;
  const text = `${title} ${description}`.toLocaleLowerCase('ru');
  const matches = (pattern: RegExp) => pattern.test(text);
  const name = matches(/roi|дрр|выруч|продаж|оплат|покуп/) ? 'moneys'
    : matches(/crm|сделк/) ? 'hierarchy-2'
      : matches(/аналит|отч[её]т|статист|окупаем|метрик/) ? 'graph'
        : matches(/реклам|кампан|показ|медийн|экран/) ? 'monitor'
          : matches(/email|почт|письм/) ? 'send-2'
            : matches(/смс/) ? 'sms'
              : matches(/сообщ|чат|мессендж/) ? 'message'
                : matches(/звон|дозвон|разговор/) ? 'call'
                  : matches(/номер/) ? 'mobile'
                    : matches(/лид|заявк|форм/) ? 'clipboard-tick'
                      : matches(/менеджер|клиент|посетител|контакт/) ? 'user'
                        : matches(/аудитор|сегмент/) ? 'people'
                          : matches(/сайт|лендинг|виджет|баннер|страниц/) ? 'monitor-mobbile'
                            : matches(/тег/) ? 'tag'
                              : matches(/ии|автомат|квалиф|обработ/) ? 'cpu'
                                : matches(/промокод|скид/) ? 'discount-shape'
                                  : matches(/автомоб|трейд/) ? 'car'
                                    : matches(/интеграц|передач|объедин/) ? 'cloud-connection'
                                      : matches(/24\/7|время|быстр|мгнов/) ? 'clock'
                                        : matches(/гео|мест/) ? 'location'
                                          : matches(/точн|контрол|качеств|результ/) ? 'verify'
                                            : matches(/источник|канал|путь/) ? 'share'
                                              : undefined;
  return name ? `${ROOT}/icons-${name}.svg` : productIconPath(productId);
}

export function tintedIconPath(path: string, accent: string): string {
  return `${path}?tint=${accent.replace(/^#/, '')}`;
}

export function tintEssentialSvg(svg: string, accent: string): string {
  const color = `#${accent.replace(/^#/, '')}`;
  return svg.replace(/#196A82|#22B8DE/gi, color);
}
