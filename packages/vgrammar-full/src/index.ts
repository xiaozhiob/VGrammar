export * from '@visactor/vgrammar-core';
export * from '@visactor/vgrammar-hierarchy';
export * from '@visactor/vgrammar-plot';
export * from '@visactor/vgrammar-projection';
export * from '@visactor/vgrammar-sankey';
export * from '@visactor/vgrammar-wordcloud';
export * from '@visactor/vgrammar-wordcloud-shape';

import { registerAllHierarchyTransforms } from '@visactor/vgrammar-hierarchy';
import { registerProjection, registerGeoTransforms } from '@visactor/vgrammar-projection';
import { registerSankeyTransforms } from '@visactor/vgrammar-sankey';
import { registerWordCloudTransforms } from '@visactor/vgrammar-wordcloud';
import { registerWordCloudShapeTransforms } from '@visactor/vgrammar-wordcloud-shape';

import {
  View,
  // components
  registerAxis,
  registerLegend,
  registerCrosshair,
  registerSlider,
  registerLabel,
  registerDataZoom,
  registerPlayer,
  registerTooltip,
  registerTitle,
  registerGrid,
  registerScrollbar,
  // animations
  clipIn,
  clipOut,
  fadeIn,
  fadeOut,
  moveIn,
  moveOut,
  scaleIn,
  scaleOut,
  rotateIn,
  rotateOut,
  growCenterIn,
  growCenterOut,
  growWidthIn,
  growWidthOut,
  growHeightIn,
  growHeightOut,
  growAngleIn,
  growAngleOut,
  growRadiusIn,
  growRadiusOut,
  growPointsIn,
  growPointsOut,
  growPointsXIn,
  growPointsXOut,
  growPointsYIn,
  growPointsYOut,
  growIntervalIn,
  growIntervalOut,
  update,
  // transforms
  registerBinTransform,
  registerContourTransform,
  registerSortTransform,
  registerFilterTransform,
  registerJoinTransform,
  registerKdeTransform,
  registerMapTransform,
  registerPickTransform,
  registerRangeTransform,
  registerStackTransform,
  registerFunnelTransform,
  registerPieTransform,
  registerCircularRelationTransform,
  registerFoldTransform,
  registerUnfoldTransform,
  registerIdentifierTransform,
  registerLttbSampleTransform,
  registerMarkOverlapTransform,
  registerDodgeTransform,
  registerJitterTransform,
  registerJitterXTransform,
  registerJitterYTransform,
  registerSymmetryTransform
} from '@visactor/vgrammar-core';

View.useRegisters([
  registerAxis,
  registerLegend,
  registerCrosshair,
  registerSlider,
  registerLabel,
  registerDataZoom,
  registerPlayer,
  registerTooltip,
  registerTitle,
  registerGrid,
  registerScrollbar,

  registerBinTransform,
  registerContourTransform,
  registerSortTransform,
  registerFilterTransform,
  registerJoinTransform,
  registerKdeTransform,
  registerMapTransform,
  registerPickTransform,
  registerRangeTransform,
  registerStackTransform,
  registerFunnelTransform,
  registerPieTransform,
  registerCircularRelationTransform,
  registerFoldTransform,
  registerUnfoldTransform,
  registerIdentifierTransform,
  registerLttbSampleTransform,
  registerMarkOverlapTransform,
  registerDodgeTransform,
  registerJitterTransform,
  registerJitterXTransform,
  registerJitterYTransform,
  registerSymmetryTransform,
  registerAllHierarchyTransforms,
  registerGeoTransforms,
  registerSankeyTransforms,
  registerWordCloudTransforms,
  registerWordCloudShapeTransforms,

  registerProjection
]);

View.useAnimations([
  clipIn,
  clipOut,
  fadeIn,
  fadeOut,
  moveIn,
  moveOut,
  scaleIn,
  scaleOut,
  rotateIn,
  rotateOut,
  growCenterIn,
  growCenterOut,
  growWidthIn,
  growWidthOut,
  growHeightIn,
  growHeightOut,
  growAngleIn,
  growAngleOut,
  growRadiusIn,
  growRadiusOut,
  growPointsIn,
  growPointsOut,
  growPointsXIn,
  growPointsXOut,
  growPointsYIn,
  growPointsYOut,
  growIntervalIn,
  growIntervalOut,
  update
]);
