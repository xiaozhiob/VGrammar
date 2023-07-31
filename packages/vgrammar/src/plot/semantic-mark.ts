import type {
  LegendBaseAttributes,
  SliderAttributes,
  DataZoomAttributes,
  BaseLabelAttrs,
  PlayerAttributes,
  OrientType
} from '@visactor/vrender-components';
import type {
  ScaleSpec,
  TransformSpec,
  MarkAnimationSpec,
  ViewSpec,
  MarkType,
  Nil,
  ValueOf,
  GenerateBaseEncodeSpec,
  ISemanticMark,
  ISemanticMarkSpec,
  ISemanticStyle,
  ParsedSimpleEncode,
  WithDefaultEncode,
  IElement,
  IAnimationConfig,
  MarkSpec,
  MarkRelativeItemSpec,
  SemanticTooltipOption,
  SemanticAxisOption,
  SemanticPlayerOption,
  SemanticLabelOption,
  SemanticDataZoomOption,
  SemanticSliderOption,
  SemanticLegendOption,
  SemanticCrosshairOption,
  CoordinateOption,
  CoordinateSpec,
  PolarCoordinateOption
} from '../types';
import type { ILogger } from '@visactor/vutils';
import { Logger, array, isArray, isBoolean, isNil, isPlainObject, merge, range } from '@visactor/vutils';
import { isContinuous, type IBaseScale, isDiscrete } from '@visactor/vscale';
import { getPalette } from '../palette';
import type {
  AxisSpec,
  CrosshairSpec,
  DatazoomSpec,
  DimensionTooltipSpec,
  LabelSpec,
  LegendSpec,
  PlayerSpec,
  SliderSpec,
  TooltipSpec
} from '../types/component';
import { DiffState, ComponentEnum } from '../graph/enums';
import { field as getFieldAccessor, toPercent } from '@visactor/vgrammar-util';
import { invokeFunctionType } from '../parse/util';
import { defaultTheme } from '../theme/default';
import type { IBaseCoordinate } from '@visactor/vgrammar-coordinate';

let semanticMarkId = -1;

export abstract class SemanticMark<EncodeSpec, K extends string> implements ISemanticMark<EncodeSpec, K> {
  //declare type: T;
  spec: ISemanticMarkSpec<EncodeSpec, K>;
  viewSpec?: ViewSpec;

  private _uid: number;
  private _logger: ILogger;
  protected _coordinate: CoordinateOption;
  readonly type: string;

  constructor(type: string, id?: string | number) {
    this.type = type;
    this._uid = ++semanticMarkId;
    this._logger = Logger.getInstance();

    this.spec = { id: id ?? `${this.type}-${this._uid}` };
  }

  parseSpec(spec: Partial<ISemanticMarkSpec<EncodeSpec, K>>) {
    if (isNil(spec.id)) {
      spec.id = this.spec.id;
    }
    this.spec = spec as ISemanticMarkSpec<EncodeSpec, K>;
    return this;
  }

  coordinate(option: CoordinateOption) {
    this._coordinate = option;
    return this;
  }

  data(values: any) {
    if (isNil(values)) {
      return this;
    }

    this.spec.data = { values };
    return this;
  }

  encode(channel: K, option: ValueOf<WithDefaultEncode<EncodeSpec, K>, K>) {
    if (!this.spec.encode) {
      this.spec.encode = {};
    }
    this.spec.encode[channel] = option;

    return this;
  }
  scale(channel: string, option: ScaleSpec) {
    if (!this.spec.scale) {
      this.spec.scale = {};
    }

    this.spec.scale[channel] = option;
    return this;
  }
  style(style: ISemanticStyle<EncodeSpec, K>) {
    this.spec.style = style;
    return this;
  }
  transform(option: TransformSpec | TransformSpec[]) {
    this.spec.transform = array(option) as TransformSpec[];

    return this;
  }
  state(state: string, option: Partial<EncodeSpec>) {
    if (([DiffState.enter, DiffState.update, DiffState.exit] as string[]).includes(state)) {
      this._logger.warn(
        `[VGrammar]: ${state} is a reserved keyword to specify the encode of different data state, 
        don't use this keyword`
      );

      return;
    }

    if (!this.spec.state) {
      this.spec.state = {};
    }
    this.spec.state[state] = option;
    return this;
  }
  animate(state: string, option: IAnimationConfig | IAnimationConfig[]) {
    if (state === 'state') {
      this._logger.warn(
        `[VGrammar]: ${state} is a keyword use to specify state animation config, don't use this keyword`
      );

      return this;
    }

    if (!this.spec.animation) {
      this.spec.animation = {};
    }

    this.spec.animation[state] = option;

    return this;
  }
  axis(channel: string, option: SemanticAxisOption | boolean = true, layout?: MarkRelativeItemSpec) {
    if (!this.spec.axis) {
      this.spec.axis = {};
    }
    this.spec.axis[channel] = { option, layout };

    return this;
  }
  legend(channel: string, option: SemanticLegendOption | boolean = true, layout?: MarkRelativeItemSpec) {
    if (!this.spec.legend) {
      this.spec.legend = {};
    }

    this.spec.legend[channel] = { option, layout };

    return this;
  }
  crosshair(channel: string, option?: SemanticCrosshairOption | boolean) {
    if (!this.spec.crosshair) {
      this.spec.crosshair = {};
    }

    this.spec.crosshair[channel] = option;

    return this;
  }
  tooltip(option: SemanticTooltipOption | boolean) {
    this.spec.tooltip = option;

    return this;
  }

  slider(channel: string, option?: SemanticSliderOption | boolean, layout?: MarkRelativeItemSpec) {
    if (!this.spec.slider) {
      this.spec.slider = {};
    }

    this.spec.slider[channel] = { option, layout };

    return this;
  }
  datazoom(channel: string, option?: SemanticDataZoomOption | boolean, layout?: MarkRelativeItemSpec) {
    if (!this.spec.datazoom) {
      this.spec.datazoom = {};
    }

    this.spec.datazoom[channel] = { option, layout };

    return this;
  }
  label(channel: string, option?: SemanticLabelOption | boolean) {
    if (!this.spec.label) {
      this.spec.label = {};
    }

    this.spec.label[channel] = option;

    return this;
  }
  player(data?: any[], option?: SemanticPlayerOption | boolean, layout?: MarkRelativeItemSpec) {
    this.spec.player = { data, option, layout };

    return this;
  }

  abstract setMarkType(): MarkType;
  abstract parseScaleByEncode(channel: K, option: ValueOf<WithDefaultEncode<EncodeSpec, K>, K>): ScaleSpec | Nil;
  abstract convertMarkEncode(encode: WithDefaultEncode<EncodeSpec, K>): GenerateBaseEncodeSpec<EncodeSpec>;

  protected setDefaultTranform(): TransformSpec[] {
    return [];
  }

  protected convertMarkTransform() {
    const defaultTransform = this.setDefaultTranform();
    const userTransform = this.spec.transform;

    if (defaultTransform && defaultTransform.length) {
      if (userTransform && userTransform.length) {
        let transforms = [];
        const excludeIndex = [];

        for (let i = 0, len = userTransform.length; i < len; i++) {
          const customizedSpec = userTransform[i];
          const index = defaultTransform.findIndex(entry => entry.type === customizedSpec.type);

          if (index >= 0) {
            transforms.push(Object.assign({}, defaultTransform[index], customizedSpec));
            excludeIndex.push(index);
          } else {
            transforms.push(customizedSpec);
          }
        }

        for (let j = 0, dlen = defaultTransform.length; j < dlen; j++) {
          if (!excludeIndex.includes(j)) {
            transforms = [defaultTransform[j]].concat(transforms);
          }
        }

        return transforms;
      }

      return defaultTransform;
    }

    return userTransform;
  }

  protected convertMarkAnimation(): MarkAnimationSpec {
    if (!this.spec.animation) {
      return null;
    }

    return this.spec.animation;
  }

  protected convertSimpleMarkEncode(encode: WithDefaultEncode<EncodeSpec, K>): ParsedSimpleEncode<EncodeSpec, K> {
    if (!encode) {
      return {};
    }

    const markEncoder = {};

    Object.keys(encode).map(channel => {
      markEncoder[channel] = { field: encode[channel], scale: this.getScaleId(channel) };
    });

    return markEncoder;
  }

  protected getDataIdOfFiltered() {
    return `${this.spec.id}-data-filtered`;
  }

  protected getDataIdOfMain() {
    return `${this.spec.id}-data`;
  }

  protected getDataIdOfPlayer() {
    return `${this.spec.id}-player`;
  }

  protected getDataZoomScaleId(channel: string) {
    return {
      x: `datazoom-scale-${channel}-x`,
      y: `datazoom-scale-${channel}-y`
    };
  }

  protected getScaleId(channel: string) {
    return this.spec.scale?.[channel]?.id ?? `scale-${channel}`;
  }

  protected getMarkId() {
    return `${this.spec.id}-mark`;
  }

  protected getScaleSpec(scaleId: string) {
    return this.viewSpec?.scales?.find?.(scale => scale.id === scaleId);
  }

  protected parseScaleOfEncodeX(option: ValueOf<WithDefaultEncode<EncodeSpec, K>, K>): ScaleSpec | Nil {
    return {
      type: 'band',
      id: this.getScaleId('x'),
      dependency: ['viewBox'],
      domain: {
        data: this.getDataIdOfFiltered(),
        field: option as string
      },
      range: this._coordinate
        ? { coordinate: this._coordinate.id, dimension: 'x' }
        : (scale: IBaseScale, params: any) => {
            return [0, params.viewBox.width()];
          }
    };
  }

  protected parseScaleOfEncodeY(option: ValueOf<WithDefaultEncode<EncodeSpec, K>, K>): ScaleSpec | Nil {
    return {
      type: 'linear',
      dependency: ['viewBox'],
      id: this.getScaleId('y'),
      domain: {
        data: this.getDataIdOfFiltered(),
        field: option as string
      },
      range: this._coordinate
        ? { coordinate: this._coordinate.id, dimension: 'y' }
        : (scale: IBaseScale, params: any) => {
            return [params.viewBox.height(), 0];
          }
    };
  }

  protected parseScaleOfEncodeColor(option: ValueOf<WithDefaultEncode<EncodeSpec, K>, K>): ScaleSpec | Nil {
    return {
      type: 'ordinal',
      id: this.getScaleId('color'),
      domain: {
        data: this.getDataIdOfMain(),
        field: option as string
      },
      range: getPalette()
    };
  }
  protected parseScaleOfEncodeGroup(option: ValueOf<WithDefaultEncode<EncodeSpec, K>, K>): ScaleSpec | Nil {
    return {
      type: 'ordinal',
      id: this.getScaleId('group'),
      domain: {
        data: this.getDataIdOfMain(),
        field: option as string
      },
      range: getPalette()
    };
  }

  protected parseScaleOfCommonEncode(
    channel: K,
    option: ValueOf<WithDefaultEncode<EncodeSpec, K>, K>
  ): ScaleSpec | Nil {
    if (channel === 'x') {
      return this.parseScaleOfEncodeX(option);
    }

    if (channel === 'y') {
      return this.parseScaleOfEncodeY(option);
    }

    if (channel === 'color') {
      return this.parseScaleOfEncodeColor(option);
    }

    if (channel === 'group') {
      return this.parseScaleOfEncodeGroup(option);
    }

    return null;
  }

  protected setDefaultAxis(): Record<string, Partial<AxisSpec>> {
    return {};
  }

  protected parseAxisSpec(): AxisSpec[] {
    const axis = this.spec.axis;
    const res: AxisSpec[] = [];

    if (axis) {
      Object.keys(axis).forEach(channel => {
        const { option, layout } = this.parseOption<SemanticAxisOption>(axis[channel]);

        if (option) {
          const axisMarkSpec: AxisSpec = {
            type: 'component',
            componentType: ComponentEnum.axis,
            scale: this.getScaleId(channel),
            dependency: ['viewBox'],
            tickCount: (option as SemanticAxisOption).tickCount,
            encode: {
              update: (datum: any, elment: IElement, params: any) => {
                const positionAttrs = this._coordinate
                  ? {}
                  : channel === 'x'
                  ? {
                      x: 0,
                      y: params.viewBox.height(),
                      start: { x: 0, y: 0 },
                      end: { x: params.viewBox.width(), y: 0 }
                    }
                  : {
                      x: 0,
                      y: params.viewBox.height(),
                      start: { x: 0, y: 0 },
                      verticalFactor: -1,
                      end: { x: 0, y: -params.viewBox.height() }
                    };

                return isPlainObject(option) ? Object.assign(positionAttrs, option) : positionAttrs;
              }
            }
          };
          axisMarkSpec.layout = layout ?? {
            position: this._coordinate
              ? 'auto'
              : isPlainObject(layout) && !isNil((layout as SemanticAxisOption).orient)
              ? (layout as SemanticAxisOption).orient
              : channel === 'x'
              ? 'bottom'
              : 'left'
          };
          res.push(axisMarkSpec);
        }
      });
    }

    return res;
  }

  protected parseOption<T>(spec: { option: T | boolean; layout?: MarkRelativeItemSpec } | T | boolean) {
    let option: T | boolean;
    let layout: MarkRelativeItemSpec;

    if (isPlainObject(spec)) {
      if (isNil((spec as any).option)) {
        option = spec as T;
      } else {
        option = (spec as { option: T | boolean; layout?: MarkRelativeItemSpec }).option;
        layout = (spec as { option: T | boolean; layout?: MarkRelativeItemSpec }).layout;
      }
    } else {
      option = spec;
    }

    return { option, layout };
  }

  protected setDefaultLegend(): Record<string, Partial<LegendSpec>> {
    return {};
  }

  protected parseLegendSpec(): LegendSpec[] {
    const legend = this.spec.legend;
    const res: LegendSpec[] = [];

    if (legend) {
      Object.keys(legend).forEach(channel => {
        const { option, layout } = this.parseOption<SemanticLegendOption>(legend[channel]);

        if (option) {
          const markLayout =
            layout ??
            (isPlainObject(option) && !isNil((option as LegendBaseAttributes).layout)
              ? (option as LegendBaseAttributes).layout === 'horizontal'
                ? { position: 'top', align: 'center' }
                : (option as LegendBaseAttributes).layout === 'vertical'
                ? { position: 'right', align: 'middle' }
                : { position: 'top', align: 'center' }
              : { position: 'top', align: 'center' });
          const markSpec: LegendSpec = {
            type: 'component',
            componentType: ComponentEnum.legend,
            scale: this.getScaleId(channel),
            dependency: ['viewBox'],
            target: {
              data: this.getDataIdOfFiltered(),
              filter: this.spec.encode?.[channel]
            },
            encode: {
              update: (datum: any, elment: IElement, params: any) => {
                const calculatedAttrs =
                  markLayout.position === 'left'
                    ? {
                        layout: 'vertical',
                        x: elment.mark?.relativePosition?.left ?? 0, // todo, this is a dynamic number
                        y: elment.mark?.relativePosition?.top ?? 0
                      }
                    : markLayout.position === 'right'
                    ? {
                        layout: 'vertical',
                        x: elment.mark?.relativePosition?.left ?? params.viewBox.width(),
                        y: elment.mark?.relativePosition?.top ?? 0
                      }
                    : markLayout.position === 'bottom'
                    ? {
                        layout: 'horizontal',
                        x: elment.mark?.relativePosition?.left ?? 0,
                        y: elment.mark?.relativePosition?.top ?? params.viewBox.height()
                      }
                    : {
                        layout: 'horizontal',
                        x: elment.mark?.relativePosition?.left ?? 0,
                        y: elment.mark?.relativePosition?.top ?? 0
                      };
                const attrs = isPlainObject(option) ? Object.assign({}, calculatedAttrs, option) : calculatedAttrs;

                return attrs;
              }
            }
          };
          markSpec.layout = markLayout;
          res.push(markSpec);
        }
      });
    }

    return res;
  }

  protected setDefaultCorsshair(): Record<string, Pick<CrosshairSpec, 'crosshairShape' | 'crosshairType'>> {
    return {};
  }

  protected getVisualChannel(channel: 'x' | 'y'): 'x' | 'y' | 'angle' | 'radius' {
    if (this._coordinate?.type === 'polar') {
      return this._coordinate.transpose ? (channel === 'x' ? 'radius' : 'angle') : channel === 'x' ? 'angle' : 'radius';
    }

    return (this._coordinate?.transpose ? (channel === 'x' ? 'y' : 'x') : channel) as 'x' | 'y' | 'angle' | 'radius';
  }

  protected parseCrosshairSpec(): CrosshairSpec[] {
    const defaultCrosshair = this.setDefaultCorsshair();
    const defaultKeys = Object.keys(defaultCrosshair);
    const crosshairKeys = this.spec.crosshair
      ? Object.keys(this.spec.crosshair).reduce((res, key) => {
          if (!res.includes(key)) {
            res.push(key);
          }

          return res;
        }, defaultKeys)
      : defaultKeys;
    const res: CrosshairSpec[] = [];

    if (crosshairKeys.length) {
      crosshairKeys.forEach(channel => {
        const userOption = this.spec.crosshair?.[channel];
        const option = userOption ?? defaultCrosshair[channel];

        if (option) {
          const scaleId = this.getScaleId(channel);
          const scaleSpec = this.getScaleSpec(scaleId);

          const markSpec: CrosshairSpec = {
            type: 'component',
            componentType: ComponentEnum.crosshair,
            scale: this.getScaleId(channel),
            dependency: ['viewBox'],
            crosshairShape: isBoolean(option)
              ? scaleSpec?.type === 'band'
                ? 'rect'
                : 'line'
              : (option as CrosshairSpec).crosshairShape ?? (scaleSpec?.type === 'band' ? 'rect' : 'line'),
            crosshairType: this.getVisualChannel(channel as 'x' | 'y')
          };

          if (isPlainObject(userOption)) {
            markSpec.encode = {
              update: userOption
            };
            if (userOption.type === 'polygon') {
              markSpec.crosshairType = 'radius-polygon';
              const anotherDimScaleId = this.getScaleId(channel === 'x' ? 'y' : 'x');
              (markSpec.dependency as string[]).push(anotherDimScaleId);
              (markSpec.encode.update as any).sides = (datum: any, el: IElement, params: any) => {
                const scale = params[anotherDimScaleId];

                return scale && isDiscrete(scale.type) ? scale.domain().length : undefined;
              };
              (markSpec.encode.update as any).startAngle = (datum: any, el: IElement, params: any) => {
                const scale = params[anotherDimScaleId];

                return scale && isDiscrete(scale.type) ? scale.range()[0] + (scale?.bandwidth?.() ?? 0) / 2 : undefined;
              };
              (markSpec.encode.update as any).endAngle = (datum: any, el: IElement, params: any) => {
                const scale = params[anotherDimScaleId];

                return scale && isDiscrete(scale.type) ? scale.range()[1] + (scale?.bandwidth?.() ?? 0) / 2 : undefined;
              };
            }
          }
          res.push(markSpec);
        }
      });
    }

    return res;
  }

  protected setDefaultTooltip(): SemanticTooltipOption | Nil {
    return null;
  }

  protected parseTooltipSpec(): Array<TooltipSpec | DimensionTooltipSpec> | Nil {
    const defaultTooltipSpec = this.setDefaultTooltip();
    const userTooltipSpec = this.spec.tooltip;

    if (userTooltipSpec !== false && userTooltipSpec !== null) {
      const res: Array<TooltipSpec | DimensionTooltipSpec> = [];
      const tooltipSpec = Object.assign({}, defaultTooltipSpec, userTooltipSpec === true ? {} : userTooltipSpec);
      const colorChannel = isNil((this.spec.encode as any).color) ? 'group' : 'color';
      const colorEncode = (this.spec.encode as any)[colorChannel];
      const dependency = colorEncode ? [this.getScaleId(colorChannel)] : [];
      const colorAccessor = colorEncode ? getFieldAccessor(colorEncode) : null;
      const title = {
        visible: !!tooltipSpec.title || !!tooltipSpec.staticTitle,
        key: 'title',
        value: !isNil(tooltipSpec.staticTitle)
          ? tooltipSpec.staticTitle
          : {
              field: (datum: any, el: IElement, params: any) => {
                return tooltipSpec.title && datum?.length ? getFieldAccessor(tooltipSpec.title)(datum[0]) : undefined;
              }
            }
      };
      const content =
        isArray(tooltipSpec.content) && tooltipSpec.content.length
          ? tooltipSpec.content.map(entry => {
              return {
                key: entry.key
                  ? { field: entry.key }
                  : !isNil(tooltipSpec.staticContentKey)
                  ? { value: tooltipSpec.staticContentKey }
                  : (datum: any, el: IElement, params: any) => {
                      return colorAccessor ? colorAccessor(datum) : undefined;
                    },
                value: { field: entry.value },
                symbol: (datum: any, el: IElement, params: any) => {
                  const scale = params[this.getScaleId(colorChannel)];

                  return {
                    symbolType: entry.symbol
                      ? invokeFunctionType(
                          {
                            symbolType: { field: entry.symbol }
                          },
                          params,
                          datum,
                          el
                        )?.symbolType ?? 'circle'
                      : 'circle',
                    fill: scale && colorAccessor ? scale.scale(colorAccessor(datum)) : getPalette()[0]
                  };
                }
              };
            })
          : null;
      if (tooltipSpec.disableGraphicTooltip !== true) {
        res.push({
          type: 'component',
          componentType: ComponentEnum.tooltip,
          target: this.getMarkId(),
          dependency,
          title,
          content
        } as TooltipSpec);
      }

      if (tooltipSpec.disableDimensionTooltip !== true) {
        res.push({
          type: 'component',
          tooltipType: this.getVisualChannel('x' as 'x' | 'y'),
          scale: this.getScaleId('x'),
          dependency,
          componentType: ComponentEnum.dimensionTooltip,
          target: { data: this.getDataIdOfFiltered(), filter: (this.spec.encode as any)?.x },
          title,
          content,
          avoidMark: [this.getMarkId()]
        } as DimensionTooltipSpec);
      }

      return res;
    }

    return null;
  }

  protected setDefaultSlider(): Record<string, Partial<SliderSpec>> {
    return {};
  }

  protected parseSliderSpec(): SliderSpec[] {
    const slider = this.spec.slider;
    const res: SliderSpec[] = [];

    if (slider) {
      Object.keys(slider).forEach(channel => {
        const { option, layout } = this.parseOption<SemanticSliderOption>(slider[channel]);

        if (option) {
          const scaleId = this.getScaleId(channel);
          const scaleSpec = this.getScaleSpec(scaleId);
          const dataId = this.getDataIdOfMain();

          if (!scaleSpec || !isContinuous(scaleSpec.type)) {
            this._logger.warn(`[VGrammar]: Don't use slider in a channel which has scale type = ${scaleSpec?.type}`);
            return;
          }
          const getter = getFieldAccessor(this.spec.encode?.[channel]);
          const markLayout =
            layout ??
            (isPlainObject(option) && !isNil((option as SliderAttributes).layout)
              ? (option as SliderAttributes).layout === 'horizontal'
                ? { position: 'top', align: 'center' }
                : (option as SliderAttributes).layout === 'vertical'
                ? { position: 'right', align: 'middle' }
                : { position: 'top', align: 'center' }
              : { position: 'top', align: 'center' });

          const markSpec: SliderSpec = {
            type: 'component',
            componentType: ComponentEnum.slider,
            dependency: ['viewBox', dataId],
            min: (datum: any, elment: IElement, params: any) => {
              const data = params[dataId];

              return Math.min.apply(null, data.map(getter));
            },
            max: (datum: any, elment: IElement, params: any) => {
              const data = params[dataId];

              return Math.max.apply(null, data.map(getter));
            },
            target: {
              data: this.getDataIdOfFiltered(),
              filter: this.spec.encode?.[channel]
            },
            encode: {
              update: (datum: any, elment: IElement, params: any) => {
                const calculatedAttrs =
                  markLayout.position === 'left'
                    ? {
                        layout: 'vertical',
                        x: elment.mark?.relativePosition?.left ?? 0, // todo, this is a dynamic number
                        y: elment.mark?.relativePosition?.top ?? 0,
                        railWidth: defaultTheme.slider.railHeight,
                        railHeight: params.viewBox.height()
                      }
                    : markLayout.position === 'right'
                    ? {
                        layout: 'vertical',
                        x: elment.mark?.relativePosition?.left ?? params.viewBox.width(),
                        y: elment.mark?.relativePosition?.top ?? 0,
                        railWidth: defaultTheme.slider.railHeight,
                        railHeight: params.viewBox.height()
                      }
                    : markLayout.position === 'bottom'
                    ? {
                        layout: 'horizontal',
                        x: elment.mark?.relativePosition?.left ?? 0,
                        y: elment.mark?.relativePosition?.top ?? params.viewBox.height(),
                        railHeight: defaultTheme.slider.railHeight,
                        railWidth: params.viewBox.width()
                      }
                    : {
                        layout: 'horizontal',
                        x: elment.mark?.relativePosition?.left ?? 0,
                        y: elment.mark?.relativePosition?.top ?? 0,
                        railHeight: defaultTheme.slider.railHeight,
                        railWidth: params.viewBox.width()
                      };
                const attrs = isPlainObject(option) ? Object.assign({}, calculatedAttrs, option) : calculatedAttrs;

                return attrs;
              }
            }
          };
          markSpec.layout = markLayout;
          res.push(markSpec);
        }
      });
    }

    return res;
  }

  protected setDefaultDataZoom(): Record<string, Partial<DatazoomSpec>> {
    return {};
  }

  protected getVisiualPositionByDimension(channel: string) {
    return channel === 'y' ? 'left' : 'bottom';
  }

  protected parseDataZoomSpec(): DatazoomSpec[] {
    const datazoom = this.spec.datazoom;
    const res: DatazoomSpec[] = [];

    if (datazoom) {
      Object.keys(datazoom).forEach(channel => {
        const { option, layout } = this.parseOption<SemanticDataZoomOption>(datazoom[channel]);

        if (option) {
          const dataId = this.getDataIdOfMain();
          const markLayout =
            layout ??
            (isPlainObject(option) && !isNil((option as DataZoomAttributes).orient)
              ? { position: (option as DataZoomAttributes).orient }
              : { position: this.getVisiualPositionByDimension(channel) });
          const preview: DatazoomSpec['preview'] = {
            data: dataId
          };
          const { x, y } = this.getDataZoomScaleId(channel);

          if (channel === 'x') {
            preview.x = { scale: x, field: this.spec.encode?.[channel] };
            preview.y = { scale: y, field: (this.spec.encode as any)?.y };
          } else {
            preview[markLayout.position === 'top' || markLayout.position === 'bottom' ? 'x' : 'y'] = {
              scale: x,
              field: (this.spec.encode as any)?.[channel] ?? channel
            };
          }

          const markSpec: DatazoomSpec = {
            type: 'component',
            componentType: ComponentEnum.datazoom,
            dependency: ['viewBox', dataId],
            target: {
              data: this.getDataIdOfFiltered(),
              filter: this.spec.encode?.[channel]
            },
            preview,
            encode: {
              update: (datum: any, elment: IElement, params: any) => {
                const calculatedAttrs =
                  markLayout.position === 'left'
                    ? {
                        orient: markLayout.position as OrientType,
                        x: elment.mark?.relativePosition?.left ?? 0, // todo, this is a dynamic number
                        y: elment.mark?.relativePosition?.top ?? 0,
                        size: { height: params.viewBox.height(), width: defaultTheme.datazoom.size.height }
                      }
                    : markLayout.position === 'right'
                    ? {
                        orient: markLayout.position as OrientType,
                        x: elment.mark?.relativePosition?.left ?? params.viewBox.width(),
                        y: elment.mark?.relativePosition?.top ?? 0,
                        size: { height: params.viewBox.height(), width: defaultTheme.datazoom.size.height }
                      }
                    : markLayout.position === 'bottom'
                    ? {
                        orient: markLayout.position as OrientType,
                        x: elment.mark?.relativePosition?.left ?? 0,
                        y: elment.mark?.relativePosition?.top ?? params.viewBox.height(),
                        size: { width: params.viewBox.width(), height: defaultTheme.datazoom.size.height }
                      }
                    : {
                        orient: markLayout.position as OrientType,
                        x: elment.mark?.relativePosition?.left ?? 0,
                        y: elment.mark?.relativePosition?.top ?? 0,
                        size: { width: params.viewBox.width(), height: defaultTheme.datazoom.size.height }
                      };

                const attrs = isPlainObject(option) ? Object.assign({}, calculatedAttrs, option) : calculatedAttrs;

                return attrs;
              }
            }
          };
          markSpec.layout = markLayout;
          res.push(markSpec);
        }
      });
    }

    return res;
  }

  protected setDefaultLabel(): Record<string, Partial<LabelSpec>> {
    return {};
  }

  protected getLabelPosition(): string {
    if (this._coordinate?.type === 'polar') {
      return this._coordinate.transpose ? 'endAngle' : 'outer';
    }

    return this._coordinate?.transpose ? 'right' : 'top';
  }

  protected parseLabelSpec(): LabelSpec[] {
    const label = this.spec.label;
    const res: LabelSpec[] = [];

    if (label) {
      Object.keys(label).forEach(channel => {
        const option = label[channel];

        if (option) {
          const markSpec: LabelSpec = {
            type: 'component',
            componentType: ComponentEnum.label,
            target: this.getMarkId(),
            layout: {
              position: 'content',
              skipBeforeLayouted: true
            },
            labelStyle: isPlainObject(option)
              ? Object.assign(
                  {
                    position: this.getLabelPosition()
                  },
                  option as BaseLabelAttrs
                )
              : { position: this.getLabelPosition() },
            encode: {
              update: {
                text: { field: this.spec.encode[channel] }
              }
            }
          };
          res.push(markSpec);
        }
      });
    }

    return res;
  }

  protected setDefaultPlayer(): Record<string, Partial<PlayerSpec>> {
    return {};
  }

  protected parsePlayerSpec(): PlayerSpec[] {
    const player = this.spec.player;
    const res: PlayerSpec[] = [];

    if (player) {
      const option = player?.option;
      const layout = player?.layout;

      if (option) {
        const markLayout =
          layout ??
          (isPlainObject(option) && !isNil((option as PlayerAttributes).orient)
            ? { position: (option as PlayerAttributes).orient }
            : { position: 'bottom' });

        const markSpec: PlayerSpec = {
          type: 'component',
          componentType: ComponentEnum.player,
          dependency: ['viewBox'],
          target: {
            data: this.getDataIdOfMain(),
            source: this.getDataIdOfPlayer()
          },
          playerType: isPlainObject(option) ? (option as any).type ?? 'auto' : 'auto',
          encode: {
            update: (datum: any, elment: IElement, params: any) => {
              const calculatedAttrs =
                markLayout.position === 'left'
                  ? {
                      x: elment.mark?.relativePosition?.left ?? 0, // todo, this is a dynamic number
                      y: elment.mark?.relativePosition?.top ?? 0,
                      size: { height: params.viewBox.height(), width: 20 }
                    }
                  : markLayout.position === 'right'
                  ? {
                      x: elment.mark?.relativePosition?.left ?? params.viewBox.width(),
                      y: elment.mark?.relativePosition?.top ?? 0,
                      size: { height: params.viewBox.height(), width: 20 }
                    }
                  : markLayout.position === 'bottom'
                  ? {
                      x: elment.mark?.relativePosition?.left ?? 0,
                      y: elment.mark?.relativePosition?.top ?? params.viewBox.height(),
                      size: { width: params.viewBox.width(), height: 20 }
                    }
                  : {
                      x: elment.mark?.relativePosition?.left ?? 0,
                      y: elment.mark?.relativePosition?.top ?? 0,
                      size: { width: params.viewBox.width(), height: 20 }
                    };

              const attrs = isPlainObject(option) ? Object.assign({}, calculatedAttrs, option) : calculatedAttrs;

              return attrs;
            }
          }
        };
        markSpec.layout = markLayout;
        res.push(markSpec);
      }
    }

    return res;
  }

  protected parseDataSpec() {
    const { data, player } = this.spec;
    const res = [];

    if (player?.data) {
      res.push({
        id: this.getDataIdOfPlayer(),
        values: player.data
      });
      res.push({
        id: this.getDataIdOfMain(),
        values: player.data?.[0]
      });
      res.push({
        id: this.getDataIdOfFiltered(),
        source: this.getDataIdOfMain()
      });
    } else if (data) {
      const dataId = this.getDataIdOfMain();

      res.push({
        id: dataId,
        values: data.values
      });
      res.push({
        id: this.getDataIdOfFiltered(),
        source: dataId
      });
    }

    return res;
  }

  protected parseScaleSpec() {
    const { encode, scale, datazoom } = this.spec;
    const scales: Record<string, ScaleSpec> = {};
    if (encode) {
      Object.keys(encode).forEach(k => {
        const encodeOption = encode[k];
        const scaleId = this.getScaleId(k);

        scales[scaleId] = Object.assign(
          { id: scaleId },
          this.parseScaleByEncode(k as K, encodeOption),
          this.spec.scale?.[k]
        );
      });
    }
    if (scale) {
      Object.keys(scale).forEach(k => {
        const scaleId = this.getScaleId(k);
        if (!scales[scaleId]) {
          scales[scaleId] = scale[k];
        }
      });
    }

    if (datazoom) {
      Object.keys(datazoom).forEach(k => {
        const scaleId = this.getScaleId(k);
        const { x: xScaleId, y: yScaleId } = this.getDataZoomScaleId(k);

        if (k === 'x' && encode[k]) {
          scales[xScaleId] = {
            type: scales[scaleId].type,
            id: xScaleId,
            domain: {
              data: this.getDataIdOfMain(),
              field: encode[k]
            },
            dependency: ['viewBox'],
            range: (scale: IBaseScale, params: any) => {
              return [0, params.viewBox.width()];
            }
          };

          if ((encode as any).y) {
            scales[yScaleId] = {
              type: scales[this.getScaleId('y')]?.type ?? 'linear',
              id: yScaleId,
              domain: {
                data: this.getDataIdOfMain(),
                field: (encode as any)?.y
              },
              range: (scale: IBaseScale, params: any) => {
                const option = this.parseOption<SemanticDataZoomOption>(datazoom[k]).option;
                return [
                  0,
                  isPlainObject(option)
                    ? (option as DataZoomAttributes).size?.height ?? defaultTheme.datazoom.size.height
                    : defaultTheme.datazoom.size.height
                ];
              }
            };
          }
        } else {
          scales[xScaleId] = {
            type: scales[scaleId].type ?? 'band',
            id: xScaleId,
            domain: {
              data: this.getDataIdOfMain(),
              field: (encode as any)?.[k] ?? k
            }
          };
        }
      });
    }

    return Array.from(Object.values(scales));
  }

  protected parseCoordinateSpec(): CoordinateSpec[] {
    if (!this._coordinate) {
      return [];
    }
    const coordinate: CoordinateSpec = {
      type: this._coordinate.type ?? 'cartesian',
      transpose: this._coordinate.transpose,
      id: this._coordinate.id,
      dependency: ['viewBox'],
      start: [0, 0],
      end: (coord: IBaseCoordinate, params: any) => {
        return [params.viewBox.width(), params.viewBox.height()];
      }
    };

    if (this._coordinate.type === 'polar' && this._coordinate.origin) {
      coordinate.origin = (coord: IBaseCoordinate, params: any) => {
        return [
          toPercent((this._coordinate as PolarCoordinateOption).origin[0], params.viewBox.width()),
          toPercent((this._coordinate as PolarCoordinateOption).origin[1], params.viewBox.height())
        ] as [number, number];
      };
    }

    return [coordinate];
  }

  protected setMainMarkSpec() {
    return {};
  }

  toViewSpec(): ViewSpec {
    this.viewSpec = {};
    const filteredDataId = this.getDataIdOfFiltered();
    this.viewSpec.data = this.parseDataSpec();
    this.viewSpec.scales = this.parseScaleSpec();
    this.viewSpec.coordinates = this.parseCoordinateSpec();
    let marks: MarkSpec[] = [];

    marks = marks.concat(this.parseLegendSpec());
    marks = marks.concat(this.parseAxisSpec());
    marks = marks.concat(this.parseCrosshairSpec());
    marks = marks.concat(this.parseSliderSpec());
    marks = marks.concat(this.parseDataZoomSpec());
    marks = marks.concat(this.parsePlayerSpec());

    marks.push(
      Object.assign(
        {
          id: this.getMarkId(),
          type: this.setMarkType(),
          coordinate: this._coordinate?.id,
          from: {
            data: filteredDataId
          },
          groupBy: (this.spec.encode as any)?.group,
          layout: {
            position: 'content',
            skipBeforeLayouted: true
          },
          dependency: this.viewSpec.scales.map(scale => scale.id),
          transform: this.convertMarkTransform(),
          animation: this.convertMarkAnimation(),
          encode: Object.assign({}, this.spec.state, {
            enter: this.spec.style ?? {},
            update: this.convertMarkEncode(this.spec.encode)
          })
        },
        this.setMainMarkSpec()
      )
    );
    marks = marks.concat(this.parseLabelSpec());
    marks = marks.concat(this.parseTooltipSpec());

    this.viewSpec.marks = marks;

    return this.viewSpec;
  }

  clear() {
    this.spec = { id: this.spec.id };
  }
}
