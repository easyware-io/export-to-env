import * as core from '@actions/core';
import { expect, jest } from '@jest/globals';
import main from '../src/main';

jest.mock('@actions/core');

let mockedCore: jest.Mocked<typeof core>;

jest.mocked(core.debug).mockImplementation((s) => console.log(`DEBUG: ${s}`));
jest.mocked(core.info).mockImplementation((s) => console.log(`INFO: ${s}`));
jest.mocked(core.warning).mockImplementation((s) => console.log(`WARNING: ${s}`));

function mockInputs(inputs: { [key: string]: string }) {
  jest.mocked(core.getInput).mockImplementation((s) => inputs[s] || '');
}

describe('export-to-env', () => {
  let inputSecrets: { [key: string]: string };
  let inputSecretsBase64: { [key: string]: string };
  let newSecrets: { [key: string]: string };

  beforeEach(() => {
    inputSecrets = {
      MY_SECRET_1: 'VALUE_1',
      MY_SECRET_2: 'VALUE_2',
      my_low_secret_1: 'low_value_1',
    };

    inputSecretsBase64 = {
      MY_SECRET_1: 'VkFMVUVfMQ==',
      MY_SECRET_2: 'VkFMVUVfMg==',
      my_low_secret_1: 'bG93X3ZhbHVlXzE=',
    };

    newSecrets = {};
    jest.mocked(core.exportVariable).mockImplementation((k, v) => (newSecrets[k] = v));
  });

  it('exports all variables', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
    });
    main();
    expect(newSecrets).toEqual(inputSecrets);
  });

  it('excludes variables (single)', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      except: 'MY_SECRET_1',
    });
    main();
    delete inputSecrets.MY_SECRET_1;
    expect(newSecrets).toEqual(inputSecrets);
  });

  it('excludes variables (array)', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      except: 'MY_SECRET_1,MY_SECRET_2,ignore',
    });
    main();
    delete inputSecrets.MY_SECRET_1;
    delete inputSecrets.MY_SECRET_2;
    expect(newSecrets).toEqual(inputSecrets);
  });

  it('excludes variables (regex)', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      except: 'MY_SECRET_*,ignore',
    });
    main();
    delete inputSecrets.MY_SECRET_1;
    delete inputSecrets.MY_SECRET_2;
    expect(newSecrets).toEqual(inputSecrets);
  });

  it('onlys variables (single)', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      only: 'MY_SECRET_1',
    });
    main();

    expect(newSecrets).toEqual({
      MY_SECRET_1: inputSecrets.MY_SECRET_1,
    });
  });

  it('onlys variables (array)', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      only: 'MY_SECRET_1, MY_SECRET_2, ignore',
    });
    main();

    expect(newSecrets).toEqual({
      MY_SECRET_1: inputSecrets.MY_SECRET_1,
      MY_SECRET_2: inputSecrets.MY_SECRET_2,
    });
  });

  it('onlys variables (regex)', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      only: 'MY_SECRET_*',
    });
    main();

    expect(newSecrets).toEqual({
      MY_SECRET_1: inputSecrets.MY_SECRET_1,
      MY_SECRET_2: inputSecrets.MY_SECRET_2,
    });
  });

  it('adds a prefix', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      prefix: 'PREF_',
      only: 'MY_SECRET_1, MY_SECRET_2',
    });
    main();

    expect(newSecrets).toEqual({
      PREF_MY_SECRET_1: inputSecrets.MY_SECRET_1,
      PREF_MY_SECRET_2: inputSecrets.MY_SECRET_2,
    });
  });

  it('transforms key (lower)', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      only: 'MY_SECRET_1, MY_SECRET_2',
      transform: 'lowercase',
    });
    main();

    expect(newSecrets).toEqual({
      my_secret_1: inputSecrets.MY_SECRET_1,
      my_secret_2: inputSecrets.MY_SECRET_2,
    });
  });

  it('transforms key (camel)', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      only: 'MY_SECRET_1, MY_SECRET_2',
      transform: 'camelcase',
    });
    main();

    expect(newSecrets).toEqual({
      mySecret_1: inputSecrets.MY_SECRET_1,
      mySecret_2: inputSecrets.MY_SECRET_2,
    });
  });

  it('transforms key (pascal)', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      only: 'MY_SECRET_1, MY_SECRET_2',
      transform: 'pascalcase',
    });
    main();

    expect(newSecrets).toEqual({
      MySecret_1: inputSecrets.MY_SECRET_1,
      MySecret_2: inputSecrets.MY_SECRET_2,
    });
  });

  it('transforms key (snake)', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      only: 'MY_SECRET_1, MY_SECRET_2',
      transform: 'snakecase',
    });
    main();

    expect(newSecrets).toEqual({
      my_secret_1: inputSecrets.MY_SECRET_1,
      my_secret_2: inputSecrets.MY_SECRET_2,
    });
  });

  it('transforms prefix', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      only: 'MY_SECRET_1, MY_SECRET_2',
      prefix: 'PREFIX_',
      transform: 'snakecase',
      transformPrefix: 'true',
    });
    main();

    expect(newSecrets).toEqual({
      prefix_my_secret_1: inputSecrets.MY_SECRET_1,
      prefix_my_secret_2: inputSecrets.MY_SECRET_2,
    });
  });

  it('does not transform prefix', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      only: 'MY_SECRET_1, MY_SECRET_2',
      prefix: 'PREFIX_',
      transform: 'snakecase',
      transformPrefix: 'false',
    });
    main();

    expect(newSecrets).toEqual({
      PREFIX_my_secret_1: inputSecrets.MY_SECRET_1,
      PREFIX_my_secret_2: inputSecrets.MY_SECRET_2,
    });
  });

  it('transforms suffix', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      only: 'MY_SECRET_1, MY_SECRET_2',
      suffix: '_SUFFIX',
      transform: 'snakecase',
      transformSuffix: 'true',
    });
    main();

    expect(newSecrets).toEqual({
      my_secret_1_suffix: inputSecrets.MY_SECRET_1,
      my_secret_2_suffix: inputSecrets.MY_SECRET_2,
    });
  });

  it('does not transform suffix', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      only: 'MY_SECRET_1, MY_SECRET_2',
      suffix: '_SUFFIX',
      transform: 'snakecase',
      transformSuffix: 'false',
    });
    main();

    expect(newSecrets).toEqual({
      my_secret_1_SUFFIX: inputSecrets.MY_SECRET_1,
      my_secret_2_SUFFIX: inputSecrets.MY_SECRET_2,
    });
  });

  it('overrides variables', () => {
    process.env = {
      MY_SECRET_1: 'OVERRIDE',
    };

    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      override: 'true',
    });
    main();

    expect(newSecrets).toEqual(inputSecrets);
  });

  it('does not override variables', () => {
    process.env = {
      MY_SECRET_1: 'DONT_OVERRIDE',
    };

    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      override: 'false',
    });
    main();

    const filteredNewSecrets = Object.assign({}, newSecrets);
    delete filteredNewSecrets.MY_SECRET_1;

    expect(newSecrets).toEqual(filteredNewSecrets);
  });

  it('transforms to base64', () => {
    mockInputs({
      secrets: JSON.stringify(inputSecrets),
      convert: 'base64',
    });
    main();

    expect(newSecrets).toEqual(inputSecretsBase64);
  });
});
