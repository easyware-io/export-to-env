import * as core from '@actions/core';
import { Case } from 'change-case-all';

const transformTypes: Record<string, (s: string) => string> = {
  lowercase: (s) => s.toLowerCase(),
  uppercase: (s) => s.toUpperCase(),
  camelcase: (s) => Case.camel(s),
  constant: (s) => Case.constant(s),
  pascalcase: (s) => Case.pascal(s),
  snakecase: (s) => Case.snake(s),
};

const convertTypes: Record<string, (s: string) => string> = {
  base64: (s) => Buffer.from(s).toString('base64'),
  utf8: (s) => Buffer.from(s, 'base64').toString('utf8'),
};

export default async function run(): Promise<void> {
  try {
    const convertFn = (s: string, type: string): string => {
      try {
        if (type.length) return convertTypes[type](s);
      } catch (e) {
        throw new Error(`Cannot convert value with type "${type}". Accepted values are: ${Object.keys(convertTypes).join(', ')}`);
      }
      return s;
    };

    const secretsJson: string = core.getInput('secrets');
    const varsJson: string = core.getInput('vars');
    const onlyStr: string = core.getInput('only');
    const exceptStr: string = core.getInput('except');
    const prefix: string = core.getInput('prefix');
    const suffix: string = core.getInput('suffix');
    const overrideStr: string = core.getInput('override');
    const override = overrideStr.length ? overrideStr === 'true' : true;
    const transform: string = core.getInput('transform');
    const transformPrefixStr = core.getInput('transformPrefix');
    const transformPrefix = transformPrefixStr.length ? transformPrefixStr === 'true' : true;
    const transformSuffixStr = core.getInput('transformSuffix');
    const transformSuffix = transformSuffixStr.length ? transformSuffixStr === 'true' : true;
    const convert: string = core.getInput('convert');

    let secrets: Record<string, string> = {};
    try {
      if (secretsJson.length) secrets = JSON.parse(secretsJson);
    } catch (e) {
      throw new Error(`Cannot parse JSON secrets. \nMake sure you add the following to this action:\nwith:\n  secrets: \${{ toJSON(secrets) }}`);
    }

    let vars: Record<string, string> = {};
    try {
      if (varsJson.length) vars = JSON.parse(varsJson);
    } catch (e) {
      throw new Error(`Cannot parse JSON vars. \nMake sure you add the following to this action:\nwith:\n  vars: \${{ toJSON(vars) }}`);
    }

    let onlyList: string[] | null = null;
    if (onlyStr.length) {
      onlyList = onlyStr.split(',').map((key) => key.trim());
    }

    let exceptList = ['github_token'];
    if (exceptStr.length) {
      exceptList = exceptList.concat(exceptStr.split(',').map((key) => key.trim()));
    }

    for (const key of Object.keys(secrets)) {
      if (onlyList && !onlyList.some((item) => key.match(new RegExp(item)))) continue;
      if (exceptList.some((item) => key.match(new RegExp(item)))) continue;

      let newKey = key;

      if (prefix.length && transformPrefix) newKey = `${prefix}${newKey}`;
      if (suffix.length && transformSuffix) newKey = `${newKey}${suffix}`;

      if (transform.length) {
        if (!transformTypes[transform]) {
          throw new Error(`Unknown transform value "${transform}". Accepted values are: ${Object.keys(transformTypes).join(', ')}`);
        }
        newKey = transformTypes[transform](newKey);
      }

      if (prefix.length && !transformPrefix) newKey = `${prefix}${newKey}`;
      if (suffix.length && !transformSuffix) newKey = `${newKey}${suffix}`;

      if (process.env[newKey]) {
        if (override) {
          core.warning(`Will re-write "${newKey}" environment variable.`);
        } else {
          core.info(`Skip overwriting var ${newKey}`);
          continue;
        }
      }

      const newValue = convertFn(secrets[key], convert);

      core.exportVariable(newKey, newValue);
      core.info(`Exported secret ${newKey}`);
    }

    for (const key of Object.keys(vars)) {
      if (onlyList && !onlyList.some((item) => key.match(new RegExp(item)))) continue;
      if (exceptList.some((item) => key.match(new RegExp(item)))) continue;

      let newKey = key;

      if (prefix.length && transformPrefix) newKey = `${prefix}${newKey}`;
      if (suffix.length && transformSuffix) newKey = `${newKey}${suffix}`;

      if (transform.length) {
        if (!transformTypes[transform]) {
          throw new Error(`Unknown transform value "${transform}". Accepted values are: ${Object.keys(transformTypes).join(', ')}`);
        }
        newKey = transformTypes[transform](newKey);
      }

      if (prefix.length && !transformPrefix) newKey = `${prefix}${newKey}`;
      if (suffix.length && !transformSuffix) newKey = `${newKey}${suffix}`;

      if (process.env[newKey]) {
        if (override) {
          core.warning(`Will re-write "${newKey}" environment variable.`);
        } else {
          core.info(`Skip overwriting var ${newKey}`);
          continue;
        }
      }

      const newValue = vars[key];

      core.exportVariable(newKey, newValue);
      core.info(`Exported var ${newKey}`);
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

if (require.main === module) {
  run();
}
