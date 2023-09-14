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
  registerSymmetryTransform
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

export * from '@visactor/vgrammar-core';
