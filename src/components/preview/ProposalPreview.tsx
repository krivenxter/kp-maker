import { useMemo, type CSSProperties, type ReactNode } from 'react';
import type { ProposalDocument } from '../../schemas/proposal';
import { SLIDE } from '../../presentation/design/tokens';
import { buildOnePagerPreviewScenes, buildPreviewScenes, type PreviewElement, type PreviewScene } from '../../presentation/preview/buildPreviewScenes';

type Props = { proposal: ProposalDocument; activeSlide?: number; mode?: 'full' | 'onepager' | 'both' };

const SCALE = 100;
const width = SLIDE.width * SCALE;
const height = SLIDE.height * SCALE;

function number(options: Record<string, unknown>, key: string, fallback = 0): number {
  const value = options[key];
  return typeof value === 'number' ? value : fallback;
}

function string(options: Record<string, unknown>, key: string, fallback = ''): string {
  const value = options[key];
  return typeof value === 'string' ? value : fallback;
}

function nested(options: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = options[key];
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function color(value: unknown, fallback = 'transparent'): string {
  return typeof value === 'string' && value ? `#${value.replace(/^#/, '')}` : fallback;
}

function opacity(transparency: unknown): number {
  return typeof transparency === 'number' ? Math.max(0, Math.min(1, 1 - transparency / 100)) : 1;
}

function TextElement({ element }: { element: Extract<PreviewElement, { kind: 'text' }> }) {
  const options = element.options;
  const hyperlink = nested(options, 'hyperlink');
  const fill = nested(options, 'fill');
  const line = nested(options, 'line');
  const fontSize = number(options, 'fontSize', 11) * 4 / 3;
  const lineSpacing = number(options, 'lineSpacing') * 4 / 3;
  const textShape = string(options, 'shape');
  const style: CSSProperties = {
    display: 'flex',
    width: '100%',
    height: '100%',
    alignItems: string(options, 'valign') === 'middle' ? 'center' : string(options, 'valign') === 'bottom' ? 'flex-end' : 'flex-start',
    justifyContent: string(options, 'align') === 'center' ? 'center' : string(options, 'align') === 'right' ? 'flex-end' : 'flex-start',
    overflow: 'hidden',
    color: color(options.color, '#142027'),
    fontFamily: `"${string(options, 'fontFace', 'Museo Sans Cyrl')}", sans-serif`,
    fontSize: `${fontSize}px`,
    fontWeight: options.bold ? 700 : 400,
    letterSpacing: `${number(options, 'charSpacing') * 4 / 3}px`,
    lineHeight: lineSpacing ? `${lineSpacing}px` : 1.12,
    textAlign: string(options, 'align', 'left') as CSSProperties['textAlign'],
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    textDecoration: 'none',
    boxSizing: 'border-box',
    background: color(fill.color, 'transparent'),
    backgroundColor: color(fill.color, 'transparent'),
    opacity: opacity(options.transparency),
    border: line.color ? `${number(line, 'width', 0.8) * 4 / 3}px solid ${color(line.color)}` : undefined,
    borderColor: color(line.color, 'transparent'),
    borderRadius: textShape === 'roundRect' ? `${number(options, 'rectRadius', .1) * SCALE}px` : undefined,
  };
  const content = <div style={style}>{element.text}</div>;
  const href = string(hyperlink, 'url');
  return (
    <foreignObject
      x={number(options, 'x') * SCALE}
      y={number(options, 'y') * SCALE}
      width={number(options, 'w') * SCALE}
      height={number(options, 'h') * SCALE}
    >
      {href ? <a href={href} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>{content}</a> : content}
    </foreignObject>
  );
}

function ShapeElement({ element }: { element: Extract<PreviewElement, { kind: 'shape' }> }) {
  const options = element.options;
  const x = number(options, 'x') * SCALE;
  const y = number(options, 'y') * SCALE;
  const w = number(options, 'w') * SCALE;
  const h = number(options, 'h') * SCALE;
  const fill = nested(options, 'fill');
  const line = nested(options, 'line');
  const fillColor = color(fill.color, 'transparent');
  const strokeColor = color(line.color, 'transparent');
  const common = {
    fill: fillColor,
    fillOpacity: opacity(fill.transparency),
    stroke: strokeColor,
    strokeOpacity: opacity(line.transparency),
    strokeWidth: number(line, 'width', 0.8) * 4 / 3,
  };

  if (element.shape === 'line') {
    return <g>
      <line x1={x} y1={y} x2={x + w} y2={y + h} stroke={strokeColor} strokeOpacity={opacity(line.transparency)} strokeWidth={number(line, 'width', 0.8) * 4 / 3} />
      {line.endArrowType === 'triangle' && <polygon points={`${x + w},${y + h} ${x + w - 7},${y + h - 4} ${x + w - 7},${y + h + 4}`} fill={strokeColor} />}
    </g>;
  }
  if (element.shape === 'ellipse') return <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} {...common} />;
  if (element.shape === 'chevron') return <polygon points={`${x},${y} ${x + w * .62},${y} ${x + w},${y + h / 2} ${x + w * .62},${y + h} ${x},${y + h} ${x + w * .38},${y + h / 2}`} {...common} />;
  return <rect x={x} y={y} width={w} height={h} rx={element.shape === 'roundRect' ? number(options, 'rectRadius', .16) * SCALE : 0} {...common} />;
}

function SceneElement({ element }: { element: PreviewElement }): ReactNode {
  if (element.kind === 'text') return <TextElement element={element} />;
  if (element.kind === 'shape') return <ShapeElement element={element} />;
  const options = element.options;
  const source = string(options, 'data') || string(options, 'path');
  const sizing = nested(options, 'sizing');
  const fit = string(sizing, 'type', 'contain');
  const tint = new URLSearchParams(source.split('?')[1] ?? '').get('tint');
  if (tint) return <foreignObject
    x={number(options, 'x') * SCALE}
    y={number(options, 'y') * SCALE}
    width={number(options, 'w') * SCALE}
    height={number(options, 'h') * SCALE}
  >
    <div style={{ width: '100%', height: '100%', background: `#${tint}`, opacity: opacity(options.transparency), mask: `url("${source.split('?')[0]}") center / contain no-repeat`, WebkitMask: `url("${source.split('?')[0]}") center / contain no-repeat` }} />
  </foreignObject>;
  return <image
    href={source}
    x={number(options, 'x') * SCALE}
    y={number(options, 'y') * SCALE}
    width={number(options, 'w') * SCALE}
    height={number(options, 'h') * SCALE}
    preserveAspectRatio={fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet'}
    opacity={opacity(options.transparency)}
    style={{ clipPath: options.rounding ? 'circle(50%)' : undefined }}
  />;
}

function Scene({ scene }: { scene: PreviewScene }) {
  return <svg className="preview-scene" viewBox={`0 0 ${width} ${height}`} role="img">
    <rect width={width} height={height} fill={color(scene.background?.color, '#111A1F')} />
    {scene.elements.map((element, index) => <SceneElement element={element} key={index} />)}
  </svg>;
}

export function ProposalPreview({ proposal, activeSlide, mode = 'full' }: Props) {
  const scenes = useMemo(() => mode === 'onepager'
    ? buildOnePagerPreviewScenes(proposal)
    : mode === 'both'
      ? [...buildPreviewScenes(proposal), ...buildOnePagerPreviewScenes(proposal)]
      : buildPreviewScenes(proposal), [proposal, mode]);
  return <div className="preview-stack">
    {scenes.map((scene, index) => <div className={`preview-frame ${activeSlide === index ? 'active' : ''}`} key={index}>
      <span>{index + 1}</span>
      <Scene scene={scene} />
    </div>)}
  </div>;
}
