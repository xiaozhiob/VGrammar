import { PointService, isNil, isString, merge } from '@visactor/vutils';
import type { IGraphic } from '@visactor/vrender';
import type { CircleAxisGridAttributes, LineAxisGridAttributes } from '@visactor/vrender-components';
// eslint-disable-next-line no-duplicate-imports
import { CircleAxisGrid, LineAxisGrid } from '@visactor/vrender-components';
import type { IBaseScale } from '@visactor/vscale';
import { getComponent, registerComponent } from '../view/register-component';
import type {
  BaseSignleEncodeSpec,
  IElement,
  IGroupMark,
  IScale,
  ITheme,
  IView,
  MarkFunctionType,
  MarkRelativeItemSpec,
  Nil,
  RecursivePartial,
  StateEncodeSpec
} from '../types';
import { AxisEnum, ComponentEnum, GridEnum } from '../graph';
import type { AxisSpec, AxisType, GridSpec, IAxis, IGrid } from '../types/component';
import { ScaleComponent } from './scale';
import { invokeEncoder } from '../graph/mark/encode';
import { invokeFunctionType } from '../parse/util';
import type { IPolarCoordinate } from '@visactor/vgrammar-coordinate';

registerComponent(
  GridEnum.lineAxisGrid,
  (attrs: LineAxisGridAttributes, mode?: '2d' | '3d') => new LineAxisGrid(attrs, mode) as unknown as IGraphic
);
registerComponent(
  GridEnum.circleAxisGrid,
  (attrs: CircleAxisGridAttributes, mode?: '2d' | '3d') => new CircleAxisGrid(attrs) as unknown as IGraphic
);

export const generateLineAxisGridAttributes = (
  scale: IBaseScale,
  theme?: ITheme,
  addition?: RecursivePartial<LineAxisGridAttributes>,
  tickCount?: number
): LineAxisGridAttributes => {
  const gridTheme = theme?.components?.grid ?? {};
  if (!scale) {
    return merge({}, gridTheme, addition ?? {});
  }
  const tickData = scale.tickData?.(tickCount) ?? [];
  const items = tickData.map(tick => ({
    id: tick.index,
    label: tick.tick,
    value: tick.value,
    rawValue: tick.tick
  }));
  return merge({}, gridTheme, { items }, addition ?? {});
};

export const generateCircleAxisGridAttributes = (
  scale: IBaseScale,
  theme?: ITheme,
  addition?: RecursivePartial<CircleAxisGridAttributes>,
  tickCount?: number
): CircleAxisGridAttributes => {
  const gridTheme = theme?.components?.circleGrid ?? {};
  if (!scale) {
    return merge({}, gridTheme, addition ?? {});
  }
  const tickData = scale.tickData?.(tickCount) ?? [];
  const items = tickData.map(tick => ({
    id: tick.index,
    label: tick.tick,
    value: tick.value,
    rawValue: tick.tick
  }));
  return merge({}, gridTheme, { items }, addition ?? {});
};

export class Grid extends ScaleComponent implements IGrid {
  protected declare spec: GridSpec;

  protected mode?: '2d' | '3d';

  private _gridComponentType: keyof typeof GridEnum;
  private _targetAxis: IAxis;

  constructor(view: IView, group?: IGroupMark, mode?: '2d' | '3d') {
    super(view, ComponentEnum.grid, group);
    this.spec.componentType = ComponentEnum.grid;
    this.mode = mode;
  }

  protected parseAddition(spec: GridSpec) {
    super.parseAddition(spec);
    this.target(spec.target);
    return this;
  }

  addGraphicItem(attrs: any, groupKey?: string) {
    const defaultAttributes = { x: 0, y: 0, start: { x: 0, y: 0 }, end: { x: 0, y: 0 }, visible: true };
    const initialAttributes = merge(defaultAttributes, attrs);
    const graphicItem = getComponent(this._getGridComponentType()).creator(initialAttributes, this.mode);
    return super.addGraphicItem(initialAttributes, groupKey, graphicItem);
  }

  target(axis: IAxis | string | Nil) {
    if (this.spec.target) {
      const prevAxis = isString(this.spec.target)
        ? (this.view.getMarkById(this.spec.target) as IAxis)
        : this.spec.target;
      this.detach(prevAxis);
    }
    this.spec.target = axis;
    const nextAxis = isString(axis) ? (this.view.getMarkById(axis) as IAxis) : axis;
    this.attach(nextAxis);
    this._targetAxis = nextAxis;

    // clear grid type when target is updated
    this._gridComponentType = null;
    this._updateComponentEncoders();

    this.commit();
    return this;
  }

  protected _updateComponentEncoders() {
    const encoders = Object.assign({ update: {} }, this.spec.encode);
    const componentEncoders: StateEncodeSpec = Object.keys(encoders).reduce((res, state) => {
      const encoder = encoders[state];
      if (encoder) {
        res[state] = {
          callback: (datum: any, element: IElement, parameters: any) => {
            const theme = this.view.getCurrentTheme();
            let addition = invokeEncoder(encoder as BaseSignleEncodeSpec, datum, element, parameters);

            let scaleGrammar: IScale;
            if (this._targetAxis) {
              const targetScale = this._targetAxis.getSpec()?.scale as IScale | string | Nil;
              scaleGrammar = isString(targetScale) ? this.view.getScaleById(targetScale) : targetScale;

              const targetElement = this._targetAxis.elements[0];
              if (targetElement) {
                switch (this._getGridComponentType()) {
                  case GridEnum.lineAxisGrid:
                    addition = Object.assign(
                      {
                        x: targetElement.getGraphicAttribute('x'),
                        y: targetElement.getGraphicAttribute('y'),
                        start: targetElement.getGraphicAttribute('start'),
                        end: targetElement.getGraphicAttribute('end'),
                        verticalFactor: targetElement.getGraphicAttribute('verticalFactor') ?? 1
                      },
                      addition
                    );
                    break;
                  case GridEnum.circleAxisGrid:
                    addition = Object.assign(
                      {
                        x: targetElement.getGraphicAttribute('x'),
                        y: targetElement.getGraphicAttribute('y'),
                        center: targetElement.getGraphicAttribute('center'),
                        radius: targetElement.getGraphicAttribute('radius'),
                        innerRadius: targetElement.getGraphicAttribute('innerRadius'),
                        inside: targetElement.getGraphicAttribute('inside'),
                        startAngle: targetElement.getGraphicAttribute('startAngle'),
                        endAngle: targetElement.getGraphicAttribute('endAngle')
                      },
                      addition
                    );
                    break;
                }
              }
            }

            const scale = scaleGrammar?.getScale?.();
            switch (this._getGridComponentType()) {
              case GridEnum.lineAxisGrid:
                // set addition length & axis type
                addition = Object.assign(
                  { length: PointService.distancePP(addition.start ?? { x: 0, y: 0 }, addition.end ?? { x: 0, y: 0 }) },
                  addition,
                  {
                    type: 'line'
                  }
                );
                return generateLineAxisGridAttributes(scale, theme, addition);
              case GridEnum.circleAxisGrid:
                return generateCircleAxisGridAttributes(scale, theme, addition);
            }
            return addition;
          }
        };
      }
      return res;
    }, {});
    this._encoders = componentEncoders;
  }

  private _getGridComponentType() {
    if (this._gridComponentType) {
      return this._gridComponentType;
    }

    if (this._targetAxis) {
      const axisComponentType = this._targetAxis.getAxisComponentType();
      switch (axisComponentType) {
        case AxisEnum.circleAxis:
          this._gridComponentType = GridEnum.circleAxisGrid;
          break;
        case AxisEnum.lineAxis:
        default:
          this._gridComponentType = GridEnum.lineAxisGrid;
      }
    }

    return this._gridComponentType;
  }
}
