import type {
  GenerateBaseEncodeSpec,
  GenerateEncoderSpec,
  TreeEncodeChannels,
  Nil,
  ScaleSpec,
  ValueOf,
  WithDefaultEncode,
  PlotTreeEncodeSpec,
  TransformSpec,
  IElement,
  DataSpec,
  MarkSpec,
  SemanticLabelOption,
  ChannelEncodeType
} from '../types';
import { SemanticMark } from './semantic-mark';
import { getPalette } from '../palette';
import { PlotMakType } from './enums';
import { GrammarMarkType } from '../graph';
import { getTransform } from '../transforms/register';
import { field as getFieldAccessor } from '@visactor/vgrammar-util';
import { getGlyph } from '../view/register-glyph';
import type { ITextAttribute } from '@visactor/vrender';

export class TreeSemanticMark extends SemanticMark<PlotTreeEncodeSpec, TreeEncodeChannels> {
  static readonly type = PlotMakType.tree;
  constructor(id?: string | number) {
    super(PlotMakType.tree, id);

    if (!getTransform(PlotMakType.tree)) {
      this._logger.error(
        `Please import registerTreeTransforms from 'vgrammar-hierarchy', 
        and run registerTreeTransforms() before use tree chart`
      );
    }

    if (!getGlyph('treePath')) {
      this._logger.error(`Please run registerTreePathGlyph() before use tree chart`);
    }
  }

  setMarkType() {
    return GrammarMarkType.symbol;
  }

  setDefaultDataTranform(): TransformSpec[] {
    return [
      {
        type: 'tree',
        width: { signal: 'viewWidth' },
        height: { signal: 'viewHeight' },
        flatten: true
      }
    ];
  }

  getDataIdOfLink() {
    return `${this.spec.data?.id ?? this.spec.id}-data-link`;
  }

  setMultipleData(): DataSpec[] {
    return [
      {
        id: this.getDataIdOfFiltered(),
        transform: [
          {
            type: 'map',
            all: true,
            callback: (datum: any) => {
              return datum[0].nodes;
            }
          }
        ]
      },
      {
        source: this.getDataIdOfMain(),
        id: this.getDataIdOfLink(),
        transform: [
          {
            type: 'map',
            all: true,
            callback: (datum: any) => {
              // return formatLinkPath(datum[0].links);
              return datum[0].links;
            }
          }
        ]
      }
    ];
  }

  parseScaleByEncode(
    channel: TreeEncodeChannels,
    option: ValueOf<WithDefaultEncode<PlotTreeEncodeSpec, TreeEncodeChannels>, TreeEncodeChannels>
  ): ScaleSpec | Nil {
    if (channel === 'color') {
      return {
        type: 'ordinal',
        id: this.getScaleId('color'),
        domain: {
          data: this.getDataIdOfFiltered(),
          field: option as string
        },
        range: getPalette()
      };
    }

    return null;
  }

  convertMarkEncode(
    encode: WithDefaultEncode<PlotTreeEncodeSpec, TreeEncodeChannels>
  ): GenerateBaseEncodeSpec<PlotTreeEncodeSpec> {
    const markEncoder = this.convertSimpleMarkEncode(encode);

    const res: GenerateEncoderSpec<PlotTreeEncodeSpec> = {
      x: { field: 'x' },
      y: { field: 'y' }
    };

    if (markEncoder.color) {
      const scaleColorId = this.getScaleId('color');
      const colorAccessor = getFieldAccessor(markEncoder.color.field);

      res.fill = (datum: any, el: IElement, params: any) => {
        const scale = params[scaleColorId];
        return datum?.datum ? scale.scale(colorAccessor(datum.datum[datum.datum.length - 1])) : undefined;
      };
    } else {
      res.fill = this.spec.style?.fill ?? getPalette()[0];
    }

    return res;
  }

  protected setLabelTextGetter(
    channel: string,
    option: SemanticLabelOption | boolean
  ): ChannelEncodeType<ITextAttribute['text']> {
    const textGetter = getFieldAccessor(channel);
    return (datum: any, el: IElement, params: any) => {
      return textGetter(datum.datum[datum.datum.length - 1]);
    };
  }

  setMainMarkSpec() {
    return { key: 'key' };
  }

  setMultiMarksSpec() {
    const label = this.spec.label;

    if (!label) {
      return null;
    }

    const marks: MarkSpec[] = [];

    marks.push({
      type: 'glyph',
      glyphType: 'treePath',
      from: { data: this.getDataIdOfLink() },
      key: 'key',
      zIndex: -1,
      encode: {
        update: {
          x0: { field: 'x0' },
          x1: { field: 'x1' },
          y0: { field: 'y0' },
          y1: { field: 'y1' },
          thickness: 1,
          round: true,
          stroke: '#333'
        }
      }
    });

    return marks;
  }
}