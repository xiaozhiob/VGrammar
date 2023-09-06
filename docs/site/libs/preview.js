const fs = require('fs');
const path = require('path');
const VRender = require('@visactor/vrender');
const VGrammar = require('@visactor/vgrammar');
const VGrammarHierarchy = require('@visactor/vgrammar-hierarchy');
const VGrammarSankey = require('@visactor/vgrammar-sankey');
const VGrammarWordcloud = require('@visactor/vgrammar-wordcloud');
const VGrammarWordcloudShape = require('@visactor/vgrammar-wordcloud-shape');
const Plot = require('@visactor/vgrammar-plot');
const VisUtil = require('@visactor/vutils');
const Canvas = require('canvas');
const fse = require('fs-extra');
const package = require('../../../packages/vgrammar/package.json');

const examplesDirectory = path.resolve(__dirname, '../assets/examples');
const previewDirectory = path.resolve(__dirname, '../public/vgrammar/preview');
const failListName = 'failedPreviewLists.json';
const languages = ['zh', 'en'];

const version = package.version;

const failedPreviewLists = [];

function getPreviewName(fullPath) {
  return `${fullPath.replaceAll('/', '-')}_${version}.png`;
}

function createImage(spec, fullPath) {
  let cs = null;
  try {
    if (!spec.width && !spec.height) {
      spec.width = 640;
      spec.height = 480;
    }
    cs = new VGrammar.View({
      // 声明使用的渲染环境以及传染对应的渲染环境参数
      mode: 'node',
      modeParams: Canvas,
      dpr: 2,
    });

    if (spec && spec.marks) {
      spec.marks.forEach(mark => {
        mark.animation = null;

        if (mark.marks) {
          mark.marks.forEach(childMark => {
            childMark.animation = null;
          });
        }
      })
    }

    cs.parseSpec(spec);

    cs.runSync();

    const buffer = cs.getImageBuffer();
    fs.writeFileSync(path.resolve(previewDirectory, getPreviewName(fullPath)), buffer);
    console.log(`Create preview for ${fullPath}`);
  } catch (error) {
    console.log(`Error when create preview for ${fullPath}`, error);
    return false;
  }
  try {
    cs?.release();
  } catch (error) {
    console.log(`Error when releasing for ${fullPath}`);
  }
  return true;
}

/**
 * 从markdown中获取 demo 执行代码
 * @param {markdown 内容} mdString
 * @returns
 */
function getCodeFromMd(mdString) {
  const exampleCodeStart = '```javascript livedemo template=vgrammar'
  const exampleCodeEnd = '```';
  const startIndex = mdString.indexOf(exampleCodeStart) + exampleCodeStart.length;
  const code = mdString.slice(startIndex, mdString.indexOf(exampleCodeEnd, startIndex));

  return getSpecFromCode(code + '\n');
}


function getSpecFromCode(codeString) {
  // eslint-disable-next-line no-eval
  try {
    const fun = new Function('VGrammar', 'VGrammarHierarchy', 'VGrammarSankey', 'VGrammarWordcloud',  'VGrammarWordcloudShape', 'VisUtil', 'VRender', 'Plot', `
      ${codeString.substr(0, codeString.indexOf('const vGrammarView = new View'))};
      return spec;
  `);
    return fun(VGrammar, VGrammarHierarchy, VGrammarSankey, VGrammarWordcloud, VGrammarWordcloudShape, VisUtil, VRender, Plot);
  } catch (error) {
    return null;
  }
}
function writePreviewToExample(fullPath) {
  const previewLink = `/vgrammar/preview/${getPreviewName(fullPath)}`;
  for (const language of languages) {
    const examplePath = path.resolve(examplesDirectory, language, `${fullPath}.md`);
    let example = fs.readFileSync(examplePath, { encoding: 'utf-8' });
    if (example.match(/cover:.*\n/)) {
      example = example.replace(/cover:.*\n/, `cover: ${previewLink}\n`);
    } else if (example.startsWith('---')) {
      example = example.replace(
        '---',
        `---
cover: ${previewLink}
---`
      );
    } else {
      example =
        `---
cover: ${previewLink}
---` + example;
    }
    fs.writeFileSync(examplePath, example, { encoding: 'utf-8' });
  }
}

function readExampleMenu() {
  const data = fs.readFileSync(path.resolve(examplesDirectory, 'menu.json'), { encoding: 'utf-8' });
  return JSON.parse(data);
}

async function previewMenuItem(menuItem, parentPath) {
  const fullPath = parentPath === '' ? menuItem.path : `${parentPath}/${menuItem.path}`;
  if (menuItem.children) {
    for (const childMenuItem of menuItem.children) {
      await previewMenuItem(childMenuItem, fullPath);
    }
  } else {
    const example = fs.readFileSync(path.resolve(examplesDirectory, 'zh', `${fullPath}.md`), { encoding: 'utf-8' });
    const code = getCodeFromMd(example);
    if (!code || !createImage(code, fullPath)) {
      failedPreviewLists.push(fullPath);
    } else {
      writePreviewToExample(fullPath);
    }
  }
}

async function preview() {
  const examplesMenu = readExampleMenu();
  fse.emptyDirSync(previewDirectory);
  for (const menuItem of examplesMenu.children) {
    await previewMenuItem(menuItem, '');
  }
  const failPath = path.resolve(previewDirectory, failListName);
  console.log(`Failure count: ${failedPreviewLists.length}, failed list written to ${failPath}`);
  fs.writeFileSync(failPath, JSON.stringify(failedPreviewLists, null, 2));
  console.log('Preview done.');
}

preview();