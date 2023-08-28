
const fs = require('fs')
const path = require('path')
const SEMVER_REG = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/gm;
const PRERELEASE = 'prerelease';
const MINOR = 'minor';
const MAJOR = 'major';
const PATCH = 'patch';
const NEXT_BUMPMS = [PRERELEASE, PATCH, MINOR, MAJOR];
const setJsonFileByKey = require('./set-json-file');


const readVersionPolicies = (
) => {
  const filePath = path.join(__dirname, '../config/rush/version-policies.json');
  return JSON.parse(fs.readFileSync(filePath).toString())
}

const parseNextBumpFromVersion = (
  versionString
) => {
  const res = SEMVER_REG.exec(versionString);

  if (res) {
    const formatted = {
      major: res[1],
      minor: res[2],
      patch: res[3],
      preReleaseName: res[4],
      preReleaseType: res[4] ? (res[4].includes('.') ? res[4].split('.')[0] : res[4]) : ''
    };

  
    if (formatted.preReleaseName) {
      return PRERELEASE;
    }
  
    if (formatted.patch === '0') {
      return formatted.minor == '0' ? MAJOR : MINOR;
    }
  
    return PATCH
  }

  console.error(`can parse nextBump from version: ${versionString}`)
  process.exit(1);
}

const writeNextBump = (
  nextBump,
) => {
  const filePath = path.join(__dirname, '../config/rush/version-policies.json');
  let fileContent = fs.readFileSync(filePath).toString()
  const json = JSON.parse(fileContent);
  const curNextBump = json[0].nextBump

  if (nextBump !== curNextBump) {
    fileContent = setJsonFileByKey(fileContent, json, ['0', 'nextBump'], nextBump);

    fs.writeFileSync(path.join(__dirname, '../config/rush/version-policies.json'), fileContent)
  }
}

const readNextBumpFromChanges = () => {
  const changeRoot = path.join(__dirname, '../changes/@visactor/vgrammar');
  const filenames = fs.readdirSync(changeRoot);

  if (filenames && filenames.length) {
  const changeType = [];

  filenames.forEach(fileName => {
    const json = JSON.parse(fs.readFileSync(path.join(changeRoot, fileName)).toString());

    if (json.changes && json.changes.length) {
      json.changes.forEach(change => {
        if (change.type && !changeType.includes(change.type)) {
          changeType.push(change.type);
        }
      })
    }
  });

  return changeType.includes(MAJOR) ? MAJOR : changeType.includes(MINOR) ? MINOR : PATCH;
 } else {
  process.exit(1);
 }
}

const checkAndUpdateNextBump = (isPre, version) => {
  let nextBump = PATCH;

  if (isPre) {
    nextBump = PRERELEASE;
  } else if (version && NEXT_BUMPMS.includes(version)) {
    nextBump = version;
  } else if (version) {
    nextBump = parseNextBumpFromVersion(version);
  } else {
    nextBump = readNextBumpFromChanges();
  }
  writeNextBump(nextBump);

  return nextBump;
}

module.exports = checkAndUpdateNextBump;
