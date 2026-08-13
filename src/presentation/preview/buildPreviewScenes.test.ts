import { describe, expect, it } from 'vitest';
import { demoFixtures } from '../../data/demoFixtures';
import { getOnePagerProducts, selectOnePagerCase } from '../../domain/onePager';
import { COLORS, fontProfileForBrand, SLIDE } from '../design/tokens';
import { buildOnePagerPreviewScenes, buildPreviewScenes } from './buildPreviewScenes';

describe('buildPreviewScenes', () => {
  const proposal = demoFixtures[0].proposal;
  const scenes = buildPreviewScenes(proposal);

  it('строит те же семь сцен, что и PPTX-рендереры', () => {
    expect(scenes).toHaveLength(7);
    expect(scenes.every((scene) => scene.elements.length > 0)).toBe(true);
  });

  it('использует только разрешённые логотипы', () => {
    const sources = scenes.flatMap((scene) => scene.elements)
      .filter((element) => element.kind === 'image')
      .map((element) => element.options.data);
    expect(sources).toContain('/logos/calltouch-light.svg');
    expect(sources).toContain('/logos/calltouch-dark.svg');
    expect(sources.includes('/logos/calltouch-white.svg')).toBe(false);
  });

  it('показывает сайт клиента в верхней плашке и не выводит номера слайдов', () => {
    const texts = scenes.flatMap((scene) => scene.elements).filter((element) => element.kind === 'text');
    expect(texts.filter((element) => element.text === proposal.client.site)).toHaveLength(7);
    expect(texts.some((element) => /calltouch\.ru\s+·\s+\d+/.test(element.text))).toBe(false);
  });

  it('убирает пустой сайт и расширяет область названия клиента', () => {
    const withoutSite = structuredClone(proposal);
    withoutSite.client.site = '';
    const noSiteScenes = buildPreviewScenes(withoutSite);
    const firstSceneTexts = noSiteScenes[0].elements.filter((element) => element.kind === 'text');
    expect(firstSceneTexts.some((element) => element.text === 'calltouch.ru')).toBe(false);
    const clientText = firstSceneTexts.find((element) => element.text === withoutSite.client.name.toUpperCase());
    expect(clientText?.kind).toBe('text');
    if (clientText?.kind === 'text') expect(clientText.options.w).toBe(4.43);
  });

  it('не растягивает изображения с нарушением пропорций', () => {
    const images = scenes.flatMap((scene) => scene.elements).filter((element) => element.kind === 'image');
    expect(images.every((element) => ['contain', 'cover'].includes(String((element.options.sizing as { type?: string } | undefined)?.type)))).toBe(true);
    expect(images.filter((element) => String(element.options.data).includes('/logos/')).every((element) => (element.options.sizing as { type: string }).type === 'contain')).toBe(true);
    expect(images.filter((element) => String(element.options.data).includes('/backgrounds/')).every((element) => (element.options.sizing as { type: string }).type === 'cover')).toBe(true);
  });

  it('применяет брендовый профиль EXLANTIX без Arial', () => {
    const fontFaces = scenes.flatMap((scene) => scene.elements)
      .filter((element) => element.kind === 'text')
      .map((element) => element.options.fontFace);
    expect(fontFaces).toContain('Unbounded');
    expect(fontFaces).toContain('Museo Sans Cyrl');
    expect(fontFaces.includes('Arial')).toBe(false);
  });

  it('использует активный профиль Museo Sans Cyrl с двумя встроенными начертаниями', () => {
    const profile = fontProfileForBrand('neutral');
    expect(profile.body).toBe('Museo Sans Cyrl');
    expect(profile.bodyFiles.map((font) => font.path)).toEqual([
      '/fonts/museosanscyrl-300.otf',
      '/fonts/museosanscyrl-700.otf',
    ]);
    expect(profile.bodyFiles.every((font) => font.fontType === 'otf')).toBe(true);
  });

  it('использует ограниченный набор базовых и адаптивных типографических стилей', () => {
    const textStyles = new Set(scenes.flatMap((scene) => scene.elements)
      .filter((element) => element.kind === 'text')
      .map((element) => [element.options.fontFace, element.options.fontSize, element.options.bold, element.options.lineSpacing].join('|')));
    expect(textStyles.size).toBeLessThanOrEqual(8);
  });

  it('не передаёт PowerPoint ненадёжное автосжатие текста', () => {
    const textElements = demoFixtures.flatMap((fixture) => [
      ...buildPreviewScenes(fixture.proposal),
      ...buildOnePagerPreviewScenes(fixture.proposal),
    ]).flatMap((scene) => scene.elements).filter((element) => element.kind === 'text');
    expect(textElements.every((element) => element.options.fit !== 'shrink')).toBe(true);
  });

  it('показывает логотипы кейсов и в полном КП, и в One-pager', () => {
    const fullCaseImages = scenes[5].elements.filter((element) => element.kind === 'image').map((element) => String(element.options.data));
    const onePagerImages = buildOnePagerPreviewScenes(proposal)[0].elements.filter((element) => element.kind === 'image').map((element) => String(element.options.data));
    expect(fullCaseImages.some((source) => source.includes('/case-logos'))).toBe(true);
    expect(onePagerImages.some((source) => source.includes('/case-logos'))).toBe(true);
  });

  it('центрирует названия кейсов относительно логотипных плашек', () => {
    const caseTexts = scenes[5].elements.filter((element) => element.kind === 'text' && ['JETOUR', 'СЗ ДЗИККИТ', 'АМ МЕДИКА'].includes(element.text));
    expect(caseTexts.length).toBeGreaterThan(0);
    expect(caseTexts.every((element) => element.kind === 'text' && element.options.valign === 'middle')).toBe(true);
  });

  it('переключает все сцены в светлую палитру и использует тёмные логотипы', () => {
    const lightProposal = structuredClone(proposal);
    lightProposal.presentationTheme = 'light';
    const lightScenes = buildPreviewScenes(lightProposal);
    const firstImages = lightScenes[0].elements.filter((element) => element.kind === 'image').map((element) => String(element.options.data));
    expect(firstImages).toContain('/backgrounds-light/prez-bg-1.png');
    expect(firstImages).toContain('/logos/calltouch-dark.svg');
    expect(firstImages).toContain('/icons/ui/gridicons_user.svg?tint=142027');
    expect(firstImages).toContain('/icons/ui/mail-solid.svg?tint=142027');
    expect(firstImages).toContain('/icons/ui/phone-solid.svg?tint=142027');
    expect(lightScenes[1].background?.color).toBe(COLORS.white);
    const lightTextColors = lightScenes.slice(1, 7).flatMap((scene) => scene.elements)
      .filter((element) => element.kind === 'text')
      .map((element) => String(element.options.color));
    expect(lightTextColors).not.toContain(COLORS.white);
    const onePagerImages = buildOnePagerPreviewScenes(lightProposal)[0].elements.filter((element) => element.kind === 'image').map((element) => String(element.options.data));
    expect(onePagerImages).toContain('/logos/calltouch-dark.svg');
    expect(onePagerImages.some((source) => source.includes('case-logos-dark'))).toBe(true);
  });

  it('уплотняет подписи продуктов и отступает метрику кейса от края One-pager', () => {
    const onePager = buildOnePagerPreviewScenes(proposal)[0].elements.filter((element) => element.kind === 'text');
    const firstProduct = getOnePagerProducts(proposal)[0];
    const productTitle = onePager.find((element) => element.text === firstProduct.shortName);
    const productSubtitle = onePager.find((element) => element.text === firstProduct.shortValue);
    expect(productTitle?.kind).toBe('text');
    expect(productSubtitle?.kind).toBe('text');
    if (productTitle?.kind === 'text' && productSubtitle?.kind === 'text') {
      expect(productSubtitle.options.y).toBe((productTitle.options.y as number) + 0.21);
    }
    const primaryMetric = selectOnePagerCase(proposal)?.metrics[0];
    const metricValue = onePager.find((element) => element.text === primaryMetric?.value);
    const metricLabel = onePager.find((element) => element.text === primaryMetric?.label);
    expect(metricValue?.kind).toBe('text');
    expect(metricLabel?.kind).toBe('text');
    if (metricValue?.kind === 'text' && metricLabel?.kind === 'text') {
      expect((metricValue.options.x as number) + (metricValue.options.w as number)).toBeLessThanOrEqual(12.3);
      expect((metricLabel.options.x as number) + (metricLabel.options.w as number)).toBeLessThanOrEqual(12.3);
    }
  });

  it('оставляет в One-pager только рекомендуемый тариф', () => {
    const proposalWithThreePlans = demoFixtures[3].proposal;
    const onePagerTexts = buildOnePagerPreviewScenes(proposalWithThreePlans)[0].elements
      .filter((element) => element.kind === 'text')
      .map((element) => element.text);
    expect(onePagerTexts).toContain('РАСШИРЕННЫЙ');
    expect(onePagerTexts).not.toContain('БАЗОВЫЙ');
    expect(onePagerTexts).not.toContain('ПРЕМИУМ');
  });

  it('опускает содержимое релевантного кейса и увеличивает метрику в заголовочном шрифте', () => {
    const onePagerScene = buildOnePagerPreviewScenes(proposal)[0];
    const description = onePagerScene.elements.find((element) => element.kind === 'text' && element.text.startsWith('Направили силы'));
    const metric = onePagerScene.elements.find((element) => element.kind === 'text' && element.text === '×74');
    const label = onePagerScene.elements.find((element) => element.kind === 'text' && element.text === 'лидов');
    expect(description?.kind).toBe('text');
    expect(metric?.kind).toBe('text');
    expect(label?.kind).toBe('text');
    if (description?.kind === 'text' && metric?.kind === 'text' && label?.kind === 'text') {
      expect(Number(description.options.y)).toBeCloseTo(5.8, 4);
      expect(Number(metric.options.y)).toBeCloseTo(5.68, 4);
      expect(Number(label.options.y)).toBeCloseTo(6.1, 4);
      expect(metric.options.fontFace).toBe('Dela Gothic One');
      expect(Number(metric.options.fontSize)).toBe(18);
      expect(Number(metric.options.w)).toBeCloseTo(1.93, 4);
      expect(metric.options.wrap).toBe(false);
    }
    const company = onePagerScene.elements.find((element) => element.kind === 'text' && element.text === 'JETOUR');
    expect(company?.kind).toBe('text');
    if (company?.kind === 'text') expect(company.options.valign).toBe('middle');
  });

  it('адаптирует длинный заголовок One-pager до генерации файла', () => {
    const longProposal = structuredClone(demoFixtures[3].proposal);
    longProposal.client.name = 'Очень длинное название комплексного проекта и группы компаний';
    const title = `РЕШЕНИЕ ДЛЯ ${longProposal.client.name.toUpperCase()}`;
    const titleElement = buildOnePagerPreviewScenes(longProposal)[0].elements.find((element) => element.kind === 'text' && element.text === title);
    expect(titleElement?.kind).toBe('text');
    if (titleElement?.kind === 'text') expect(Number(titleElement.options.fontSize)).toBeLessThan(24);
  });

  it('передаёт вручную добавленный кейс в общую сцену превью и PPTX', () => {
    const customProposal = structuredClone(proposal);
    customProposal.caseIds = ['jetour'];
    customProposal.customCases = [{
      id: 'custom-test',
      company: 'РУЧНОЙ КЕЙС',
      description: 'Описание результата, введённое менеджером вручную',
      metrics: [
        { value: '+71%', label: 'рост целевой метрики' },
        { value: '−18%', label: 'снижение стоимости обращения' },
        { value: '×2', label: 'рост скорости обработки' },
      ],
      url: 'https://calltouch.ru',
    }];
    const customScenes = buildPreviewScenes(customProposal);
    const caseTexts = customScenes[5].elements.filter((element) => element.kind === 'text').map((element) => element.text);
    expect(caseTexts).toContain('РУЧНОЙ КЕЙС');
    expect(caseTexts).toContain('+71%');
    expect(caseTexts).toContain('−18%');
    expect(caseTexts).toContain('×2');
  });

  it('использует единый текстовый элемент кнопки кейса', () => {
    const caseScene = scenes[5];
    const button = caseScene.elements.find((element) => element.kind === 'text' && element.text === 'Подробнее →');
    expect(button?.kind).toBe('text');
    if (button?.kind === 'text') {
      expect(button.options.shape).toBe('roundRect');
      expect(button.options.fill).toEqual({ color: 'D6A746' });
    }
  });

  it('использует белый текст на циановых плашках', () => {
    const textOnCyan = demoFixtures.flatMap((fixture) => [
      ...buildPreviewScenes(fixture.proposal),
      ...buildOnePagerPreviewScenes(fixture.proposal),
    ]).flatMap((scene) => scene.elements)
      .filter((element) => element.kind === 'text')
      .filter((element) => String((element.options.fill as { color?: unknown } | undefined)?.color).toUpperCase() === COLORS.cyan);
    expect(textOnCyan.length).toBeGreaterThan(0);
    expect(textOnCyan.every((element) => String(element.options.color).toUpperCase() === COLORS.white)).toBe(true);
  });

  it('сохраняет компактный жирный текст кнопки кейса в One-pager', () => {
    const onePager = buildOnePagerPreviewScenes(proposal)[0];
    const button = onePager.elements.find((element) => element.kind === 'text' && element.text === 'Подробнее →');
    expect(button?.kind).toBe('text');
    if (button?.kind === 'text') {
      expect(button.options.fontSize).toBe(8);
      expect(button.options.bold).toBe(true);
    }
  });

  it('держит пояснение метрики рядом со значением', () => {
    const caseScene = scenes[5];
    const value = caseScene.elements.find((element) => element.kind === 'text' && element.text === '×74');
    const label = caseScene.elements.find((element) => element.kind === 'text' && element.text === 'лидов');
    expect(value?.kind).toBe('text');
    expect(label?.kind).toBe('text');
    if (value?.kind === 'text' && label?.kind === 'text') {
      expect(Number(label.options.y) - Number(value.options.y)).toBeCloseTo(0.39, 4);
    }
  });

  it('располагает метрики кейса вертикально друг под другом', () => {
    const caseScene = scenes[5];
    const values = ['×74', '−30%', 'с 65% до 0%'].map((text) => caseScene.elements.find((element) => element.kind === 'text' && element.text === text));
    expect(values.every((element) => element?.kind === 'text')).toBe(true);
    if (values.every((element) => element?.kind === 'text')) {
      expect(new Set(values.map((element) => Number(element.options.x))).size).toBe(1);
      expect(Number(values[1].options.y) - Number(values[0].options.y)).toBeCloseTo(0.72, 4);
      expect(Number(values[2].options.y) - Number(values[1].options.y)).toBeCloseTo(0.72, 4);
    }
  });

  it('не выводит элементы за границы слайдов во всех демо-макетах', () => {
    const allScenes = demoFixtures.flatMap((fixture) => [
      ...buildPreviewScenes(fixture.proposal),
      ...buildOnePagerPreviewScenes(fixture.proposal),
    ]);
    for (const scene of allScenes) {
      for (const element of scene.elements) {
        const x = Number(element.options.x ?? 0);
        const y = Number(element.options.y ?? 0);
        const w = Number(element.options.w ?? 0);
        const h = Number(element.options.h ?? 0);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x + w).toBeLessThanOrEqual(SLIDE.width + 0.001);
        expect(y + h).toBeLessThanOrEqual(SLIDE.height + 0.001);
      }
    }
  });

  it('показывает на схеме иконки и пояснения этапов и результатов', () => {
    const flowScene = scenes[4];
    const flowTexts = flowScene.elements.filter((element) => element.kind === 'text').map((element) => element.text);
    const productImages = flowScene.elements.filter((element) => element.kind === 'image' && String(element.options.data).includes('/icons/essentials/'));
    expect(productImages.length).toBeGreaterThan(0);
    expect(productImages.every((element) => String(element.options.data).includes('tint=D6A746'))).toBe(true);
    expect(new Set(productImages.map((element) => String(element.options.data).split('?')[0])).size).toBeGreaterThan(3);
    expect(flowTexts).toContain('Клиент приходит из онлайн- или офлайн-канала');
    expect(flowTexts).toContain('От первого рекламного контакта до сделки и выручки');
    expect(productImages.every((element) => Number(element.options.w) <= 0.3 && Number(element.options.h) <= 0.3)).toBe(true);
  });

  it('выровняет иконку блока результатов с заголовком и подтягивает описание', () => {
    const onePagerScene = buildOnePagerPreviewScenes(proposal)[0];
    const title = onePagerScene.elements.find((element) => element.kind === 'text' && element.text === 'Точная атрибуция');
    const description = onePagerScene.elements.find((element) => element.kind === 'text' && element.text.startsWith('Источник звонка'));
    const iconTile = onePagerScene.elements.find((element) => element.kind === 'shape' && Number(element.options.x) === 0.72 && Number(element.options.y) === 5.52);
    expect(title?.kind).toBe('text');
    expect(description?.kind).toBe('text');
    expect(iconTile?.kind).toBe('shape');
    if (title?.kind === 'text' && description?.kind === 'text') {
      expect(Number(description.options.y) - Number(title.options.y)).toBeCloseTo(0.23, 4);
    }
  });

  it('использует брендовые 3D-визуалы продуктов на слайде конфигурации', () => {
    const configurationScene = scenes[2];
    const productVisuals = configurationScene.elements.filter((element) => element.kind === 'image' && String(element.options.data).includes('/visuals/'));
    expect(productVisuals.length).toBe(proposal.products.length);
    expect(productVisuals.every((element) => (element.options.sizing as { type: string }).type === 'contain')).toBe(true);
  });

  it('показывает выбранный вариант обложки', () => {
    const proposalWithCover = structuredClone(proposal);
    proposalWithCover.cover.backgroundId = 'prez-bg-4';
    const coverScene = buildPreviewScenes(proposalWithCover)[0];
    const imageSources = coverScene.elements.filter((element) => element.kind === 'image').map((element) => element.options.data);
    expect(imageSources).toContain('/backgrounds/prez-bg-4.webp');
  });

  it('использует вручную заданный контакт и фотографию', () => {
    const proposalWithManager = structuredClone(proposal);
    const photoDataUrl = 'data:image/jpeg;base64,dGVzdA==';
    proposalWithManager.managerId = 'custom';
    proposalWithManager.customManager = {
      firstName: 'Анна',
      lastName: 'Смирнова',
      position: 'Аккаунт-директор',
      email: 'anna@calltouch.net',
      phone: '+7 999 000-00-00',
      photoDataUrl,
    };
    const managerScenes = buildPreviewScenes(proposalWithManager);
    const coverTexts = managerScenes[0].elements.filter((element) => element.kind === 'text').map((element) => element.text);
    const contactImages = managerScenes.flatMap((scene) => scene.elements).filter((element) => element.kind === 'image').map((element) => element.options.data);
    const photoImages = managerScenes.flatMap((scene) => scene.elements).filter((element) => element.kind === 'image' && element.options.data === photoDataUrl);
    expect(coverTexts).toContain('Анна Смирнова');
    expect(contactImages).toContain(photoDataUrl);
    expect(photoImages.every((element) => (element.options.sizing as { type: string }).type === 'cover')).toBe(true);
  });
});
