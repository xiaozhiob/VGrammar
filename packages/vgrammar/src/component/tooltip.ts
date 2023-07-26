import type { IBounds, IPointLike } from '@visactor/vutils';
// eslint-disable-next-line no-duplicate-imports
import { AABBBounds, isValid, isObjectLike, throttle, array, isNil, isString, merge } from '@visactor/vutils';
// eslint-disable-next-line no-duplicate-imports
import type { IGraphic, IGroup } from '@visactor/vrender';
import type { TooltipAttributes, TooltipRowAttrs } from '@visactor/vrender-components';
// eslint-disable-next-line no-duplicate-imports
import { Tooltip as TooltipComponent } from '@visactor/vrender-components';
import { field as getFieldAccessor } from '@visactor/vgrammar-util';
import { registerComponent } from '../view/register-component';
import type {
  BaseSignleEncodeSpec,
  IData,
  IElement,
  IGrammarBase,
  IGroupMark,
  IMark,
  IScale,
  IView,
  Nil,
  RecursivePartial,
  StateEncodeSpec
} from '../types';
import { ComponentEnum } from '../graph';
import type {
  BaseTooltipSpec,
  DimensionTooltipSpec,
  IDimensionTooltip,
  ITooltip,
  ITooltipRow,
  TooltipSpec,
  TooltipType
} from '../types/component';
import { Component } from '../view/component';
import { defaultTheme } from '../theme/default';
import { invokeEncoder } from '../graph/mark/encode';
import { invokeFunctionType, parseFunctionType } from '../parse/util';
import { isFieldEncode } from '../parse/mark';

registerComponent(
  ComponentEnum.tooltip,
  (attrs: TooltipAttributes) => new TooltipComponent(attrs) as unknown as IGraphic
);
registerComponent(
  ComponentEnum.dimensionTooltip,
  (attrs: TooltipAttributes) => new TooltipComponent(attrs) as unknown as IGraphic
);

export const generateTooltipAttributes = (
  point: IPointLike,
  title: TooltipRowAttrs,
  content: TooltipRowAttrs[],
  bounds: IBounds,
  addition?: RecursivePartial<TooltipAttributes>
): TooltipAttributes => {
  const tooltipTheme = defaultTheme.tooltip;

  return merge(
    {},
    tooltipTheme,
    {
      visible: true,
      pointerX: point.x,
      pointerY: point.y,
      title,
      content,
      parentBounds: bounds
    },
    addition ?? {}
  );
};

export abstract class BaseTooltip extends Component {
  protected declare spec: BaseTooltipSpec;

  protected _additionalEncodeResult: any;

  protected parseAddition(spec: BaseTooltipSpec) {
    super.parseAddition(spec);
    this.title(spec.title);
    this.content(spec.content);
    return this;
  }

  title(title: ITooltipRow | string | Nil) {
    if (this.spec.title && !isString(this.spec.title)) {
      this.detach(this._parseTooltipRow(this.spec.title));
    }
    this.spec.title = title;
    if (title && !isString(title)) {
      this.attach(this._parseTooltipRow(title));
    }
    this.commit();
    return this;
  }

  content(content: ITooltipRow | ITooltipRow[] | Nil) {
    if (this.spec.content) {
      this.detach(this._parseTooltipRow(this.spec.content));
    }
    this.spec.content = content;
    if (content) {
      this.attach(this._parseTooltipRow(this.spec.content));
    }
    this.commit();
    return this;
  }

  configureComponent(config: any) {
    super.configureComponent(config);
    return this;
  }

  protected _updateComponentEncoders() {
    const encoders = Object.assign({ update: {} }, this.spec.encode);
    const componentEncoders: StateEncodeSpec = Object.keys(encoders).reduce((res, state) => {
      const encoder = encoders[state];
      if (encoder) {
        res[state] = {
          callback: (datum: any, element: IElement, parameters: any) => {
            this._additionalEncodeResult = invokeEncoder(encoder as BaseSignleEncodeSpec, datum, element, parameters);
          }
        };
      }
      return res;
    }, {});
    this._encoders = componentEncoders;
  }

  protected _parseTooltipRow(tooltipRow: ITooltipRow | ITooltipRow[] | Nil) {
    return array(tooltipRow).reduce((dependencies, row) => {
      dependencies = dependencies.concat(parseFunctionType(row.visible, this.view));
      if (!isFieldEncode(row.key)) {
        dependencies = dependencies.concat(parseFunctionType(row.key, this.view));
      }
      if (!isFieldEncode(row.value)) {
        dependencies = dependencies.concat(parseFunctionType(row.value, this.view));
      }
      if (!isFieldEncode(row.symbol)) {
        dependencies = dependencies.concat(parseFunctionType(row.symbol, this.view));
      }
      return dependencies;
    }, [] as IGrammarBase[]);
  }

  protected _computeTooltipRow(row: ITooltipRow, datum: any, parameters: any) {
    const element = this.elements[0];

    // compute visible
    let visible = invokeFunctionType(row.visible, parameters, datum, element);
    visible = isNil(visible) ? true : !!visible;

    // compute key
    let key;
    if (isFieldEncode(row.key)) {
      const fieldAccessor = getFieldAccessor(row.key.field);
      key = fieldAccessor(datum);
    } else {
      key = invokeFunctionType(row.key, parameters, datum, element);
    }
    key = isNil(key) ? undefined : isObjectLike(key) ? key : { text: key };

    // compute value
    let value;
    if (isFieldEncode(row.value)) {
      const fieldAccessor = getFieldAccessor(row.value.field);
      value = fieldAccessor(datum);
    } else {
      value = invokeFunctionType(row.value, parameters, datum, element);
    }
    value = isNil(value) ? undefined : isObjectLike(value) ? value : { text: value };

    // compute symbol
    let symbol;
    if (isFieldEncode(row.symbol)) {
      const fieldAccessor = getFieldAccessor(row.symbol.field);
      symbol = fieldAccessor(datum);
    } else {
      symbol = invokeFunctionType(row.symbol, parameters, datum, element);
    }
    symbol = isNil(symbol) ? undefined : isObjectLike(symbol) ? symbol : { symbolType: symbol };

    return { visible, key, value, shape: symbol };
  }

  protected _computeTitleContent(datum: any) {
    const parameters = this.parameters();

    const title = isValid(this.spec.title)
      ? this._computeTooltipRow(
          isString(this.spec.title) ? { value: this.spec.title } : this.spec.title,
          datum,
          parameters
        )
      : undefined;
    const content = this.spec.content
      ? array(datum).reduce((content, datumRow) => {
          return content.concat(
            array(this.spec.content).map(row => this._computeTooltipRow(row, datumRow, parameters))
          );
        }, [])
      : undefined;

    return { title, content };
  }
}

export class Tooltip extends BaseTooltip implements ITooltip {
  protected declare spec: TooltipSpec;

  private _targetMarks: IMark[] = [];
  private _lastElement: IElement;

  constructor(view: IView, group?: IGroupMark) {
    super(view, ComponentEnum.tooltip, group);
    this.spec.componentType = ComponentEnum.tooltip;
  }

  protected parseAddition(spec: TooltipSpec) {
    super.parseAddition(spec);
    this.target(spec.target);
    return this;
  }

  target(mark: IMark | IMark[] | string | string[] | Nil): this {
    if (this.spec.target) {
      const prevMarks = array(this.spec.target).map(m => (isString(m) ? this.view.getMarkById(m) : m));
      this.detach(prevMarks);
    }
    this.spec.target = mark;
    const nextMarks = array(mark).map(m => (isString(m) ? this.view.getMarkById(m) : m));
    this.attach(nextMarks);
    this._targetMarks = nextMarks.filter(m => !isNil(m));
    this.commit();
    return this;
  }

  release() {
    this.view.removeEventListener('pointermove', this._onTooltipShow);
    this.view.removeEventListener('pointerleave', this._onTooltipHide);
    super.release();
  }

  protected init(stage: any, parameters: any) {
    super.init(stage, parameters);
    this.view.addEventListener('pointermove', this._onTooltipShow);
    this.view.addEventListener('pointerleave', this._onTooltipHide);
  }

  protected _onTooltipShow = throttle((event: any, element: IElement) => {
    const tooltip = this.elements[0].getGraphicItem() as IGroup;
    if (!this._targetMarks.includes(element?.mark)) {
      tooltip.hideAll();
      return;
    }

    tooltip.showAll();

    const groupGraphicItem = this.group.getGroupGraphicItem();
    // FIXME: waiting for vRender to add transformed position to event
    const point = { x: 0, y: 0 };
    groupGraphicItem.globalTransMatrix.transformPoint(event.canvas, point);

    if (element === this._lastElement) {
      // only update pointer when element is not changed
      tooltip.setAttributes({ pointerX: point.x, pointerY: point.y } as any);
      return;
    }

    const boundsStart = { x: 0, y: 0 };
    groupGraphicItem.globalTransMatrix.transformPoint({ x: 0, y: 0 }, boundsStart);
    const boundsEnd = { x: 0, y: 0 };
    groupGraphicItem.globalTransMatrix.transformPoint(
      {
        x: this.view.getSignalById('width').getValue() as number,
        y: this.view.getSignalById('height').getValue() as number
      },
      boundsEnd
    );
    const bounds = new AABBBounds().set(boundsStart.x, boundsStart.y, boundsEnd.x, boundsEnd.y);
    const { title, content } = this._computeTitleContent(element.getDatum());
    const attributes = generateTooltipAttributes(point, title, content, bounds, this._additionalEncodeResult);
    tooltip.setAttributes(attributes);
  }, 10);

  protected _onTooltipHide = (event: any) => {
    const tooltip = this.elements[0].getGraphicItem() as IGroup;
    tooltip.hideAll();
  };
}

const isEqualTooltipDatum = (current: any[], previous: any[]) => {
  const currentDatum = array(current);
  const previousDatum = array(previous);
  if (currentDatum.length !== previousDatum.length) {
    return false;
  }
  return (
    currentDatum.every(datum => previousDatum.includes(datum)) &&
    previousDatum.every(datum => currentDatum.includes(datum))
  );
};

export class DimensionTooltip extends BaseTooltip implements IDimensionTooltip {
  protected declare spec: DimensionTooltipSpec;

  private _lastGroup: IGroup;
  private _lastDatum: any;
  private _tooltipDataFilter: ((datum: any, filterValue: any[]) => boolean) | null = null;

  constructor(view: IView, group?: IGroupMark) {
    super(view, ComponentEnum.dimensionTooltip, group);
    this.spec.componentType = ComponentEnum.dimensionTooltip;
    this.spec.tooltipType = 'x';
  }

  protected parseAddition(spec: DimensionTooltipSpec) {
    super.parseAddition(spec);
    this.scale(spec.scale);
    this.tooltipType(spec.tooltipType);
    this.target(spec.target?.data, spec.target?.filter);
    return this;
  }

  scale(scale?: IScale | string) {
    if (this.spec.scale) {
      const lastScaleGrammar = isString(this.spec.scale) ? this.view.getScaleById(this.spec.scale) : this.spec.scale;
      this.detach(lastScaleGrammar);
      this.spec.scale = undefined;
    }
    const scaleGrammar = isString(scale) ? this.view.getScaleById(scale) : scale;
    this.spec.scale = scaleGrammar;
    this.attach(scaleGrammar);
    this.commit();
    return this;
  }

  tooltipType(tooltipType: TooltipType | Nil) {
    this.spec.tooltipType = tooltipType;
    this.commit();
    return this;
  }

  target(data: IData | string | Nil, filter: string | ((datum: any, tooltipValue: any) => boolean) | Nil) {
    const lastData = this.spec.target?.data;
    if (lastData) {
      const lastDataGrammar = isString(lastData) ? this.view.getDataById(lastData) : lastData;
      this.detach(lastDataGrammar);
      this.spec.target = undefined;
    }
    const dataGrammar = isString(data) ? this.view.getDataById(data) : data;
    this._tooltipDataFilter = isString(filter)
      ? (datum: any, filterValue: any[]) => filterValue === datum[filter]
      : filter;
    if (dataGrammar) {
      this.attach(dataGrammar);
      this.spec.target = { data: dataGrammar, filter };
    }
    this.commit();
    return this;
  }

  release() {
    (this._lastGroup as any)?.off?.('pointermove', this._onTooltipShow);
    (this._lastGroup as any)?.off?.('pointerleave', this._onTooltipHide);
    super.release();
  }

  protected init(stage: any, parameters: any) {
    super.init(stage, parameters);

    const groupGraphicItem = this.group ? this.group.getGroupGraphicItem() : stage.defaultLayer;
    if (this._lastGroup !== groupGraphicItem) {
      // FIXME: waiting for vRender to fix
      (this._lastGroup as any)?.off?.('pointermove', this._onTooltipShow);
      (this._lastGroup as any)?.off?.('pointerleave', this._onTooltipHide);
    }
    groupGraphicItem?.on?.('pointermove', this._onTooltipShow);
    groupGraphicItem?.on?.('pointerleave', this._onTooltipHide);
    this._lastGroup = groupGraphicItem;
  }

  protected _onTooltipShow = throttle((event: any, element: IElement) => {
    const tooltip = this.elements[0].getGraphicItem() as IGroup;

    const scaleGrammar = isString(this.spec.scale) ? this.view.getScaleById(this.spec.scale) : this.spec.scale;
    const scale = scaleGrammar.getScale();
    const groupGraphicItem = this.group.getGroupGraphicItem();
    // FIXME: waiting for vRender to add transformed position to event
    const point = { x: 0, y: 0 };
    groupGraphicItem.globalTransMatrix.transformPoint(event.canvas, point);

    if (
      point.x < 0 ||
      point.x > groupGraphicItem.attribute.width ||
      point.y < 0 ||
      point.y > groupGraphicItem.attribute.height
    ) {
      tooltip.hideAll();
      return;
    }

    const target = this.spec.target?.data;
    const lastDataGrammar = !target ? null : isString(target) ? this.view.getDataById(target) : target;
    const data = lastDataGrammar ? lastDataGrammar.getValue() : [];

    let filterValue: any;
    switch (this.spec.tooltipType) {
      case 'y':
        filterValue = scale.invert(point.y);
        break;
      // case 'angle':
      //   datum = scale.invert(point.y);
      //   break;
      // case 'radius':
      //   datum = scale.invert(point.y);
      //   break;
      case 'x':
      default:
        filterValue = scale.invert(point.x);
        break;
    }
    const tooltipDatum = this._tooltipDataFilter
      ? data.filter(datum => this._tooltipDataFilter(datum, filterValue))
      : [];

    tooltip.showAll();
    if (isEqualTooltipDatum(tooltipDatum, this._lastDatum)) {
      // only update pointer when element is not changed
      tooltip.setAttributes({ pointerX: point.x, pointerY: point.y } as any);
      return;
    }
    this._lastDatum = tooltipDatum;

    // compute tooltip bounds
    const boundsStart = { x: 0, y: 0 };
    groupGraphicItem.globalTransMatrix.transformPoint({ x: 0, y: 0 }, boundsStart);
    const boundsEnd = { x: 0, y: 0 };
    groupGraphicItem.globalTransMatrix.transformPoint(
      {
        x: this.view.getSignalById('width').getValue() as number,
        y: this.view.getSignalById('height').getValue() as number
      },
      boundsEnd
    );
    const bounds = new AABBBounds().set(boundsStart.x, boundsStart.y, boundsEnd.x, boundsEnd.y);
    const { title, content } = this._computeTitleContent(tooltipDatum);
    const attributes = generateTooltipAttributes(point, title, content, bounds, this._additionalEncodeResult);
    tooltip.setAttributes(attributes);
  }, 10);

  protected _onTooltipHide = (event: any) => {
    const tooltip = this.elements[0].getGraphicItem() as IGroup;
    tooltip.hideAll();
  };
}
