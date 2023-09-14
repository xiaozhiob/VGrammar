import { Factory } from '@visactor/vgrammar-core';
import { registerWordCloudTransforms } from '../src';

test('transform of wordcloud', () => {
  const tranform = Factory.getTransform('wordcloud');

  expect(tranform).toBeUndefined();
  registerWordCloudTransforms();
  expect(Factory.getTransform('wordcloud')).not.toBeUndefined();
});
