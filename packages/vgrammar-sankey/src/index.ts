import { Factory } from '@visactor/vgrammar-core';
import { transform } from './transform';

export { SankeyLayout } from './layout';

export * from './interface';
export * from './format';

export const registerSankeyTransforms = () => {
  Factory.registerTransform(
    'sankey',
    {
      transform,
      markPhase: 'beforeJoin'
    },
    true
  );
};
