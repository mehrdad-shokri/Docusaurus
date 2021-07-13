/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';

import {
  excludeJS,
  clientDir,
  getDocusaurusAliases,
  createBaseConfig,
} from '../base';
import * as utils from '../utils';
import {mapValues} from 'lodash';
import {posixPath} from '@docusaurus/utils';
import {Props, ThemeAliases} from '@docusaurus/types';

describe('babel transpilation exclude logic', () => {
  test('always transpile client dir files', () => {
    const clientFiles = [
      'App.js',
      'clientEntry.js',
      'serverEntry.js',
      path.join('exports', 'Link.js'),
    ];
    clientFiles.forEach((file) => {
      expect(excludeJS(path.join(clientDir, file))).toEqual(false);
    });
  });

  test('always transpile non node_module files', () => {
    const moduleFiles = [
      '/pages/user/App.jsx',
      '/website/src/components/foo.js',
      '/src/theme/SearchBar/index.js',
    ];
    moduleFiles.forEach((file) => {
      expect(excludeJS(file)).toEqual(false);
    });
  });

  test('transpile docusaurus npm packages even in node_modules', () => {
    const moduleFiles = [
      '/website/node_modules/docusaurus-theme-search/theme/Navbar/index.js',
      'node_modules/@docusaurus/theme-classic/theme/Layout.js',
      '/docusaurus/website/node_modules/@docusaurus/theme-search-algolia/theme/SearchBar.js',
    ];
    moduleFiles.forEach((file) => {
      expect(excludeJS(file)).toEqual(false);
    });
  });

  test('does not transpile node_modules', () => {
    const moduleFiles = [
      'node_modules/react-toggle.js',
      '/website/node_modules/react-trend/index.js',
      '/docusaurus/website/node_modules/react-super.js',
      '/docusaurus/website/node_modules/@docusaurus/core/node_modules/core-js/modules/_descriptors.js',
      'node_modules/docusaurus-theme-classic/node_modules/react-daypicker/index.js',
    ];
    moduleFiles.forEach((file) => {
      expect(excludeJS(file)).toEqual(true);
    });
  });
});

describe('getDocusaurusAliases()', () => {
  test('return appropriate webpack aliases', () => {
    // using relative paths makes tests work everywhere
    const relativeDocusaurusAliases = mapValues(
      getDocusaurusAliases(),
      (aliasValue) => posixPath(path.relative(__dirname, aliasValue)),
    );
    expect(relativeDocusaurusAliases).toMatchSnapshot();
  });
});

describe('base webpack config', () => {
  const props: Props = {
    outDir: '',
    siteDir: path.resolve(__dirname, '__fixtures__', 'base_test_site'),
    siteConfig: {},
    baseUrl: '',
    generatedFilesDir: '',
    routesPaths: '',
    i18n: {
      currentLocale: 'en',
    },
    siteMetadata: {
      docusaurusVersion: '2.0.0-alpha.70',
    },
    plugins: [
      {
        getThemePath() {
          return path.resolve(
            __dirname,
            '__fixtures__',
            'base_test_site',
            'pluginThemeFolder',
          );
        },
      },
    ],
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should create webpack aliases', () => {
    // @ts-expect-error: Docusaurus webpack alias is always an object
    const aliases: ThemeAliases =
      createBaseConfig(props, true).resolve?.alias ?? {};
    // Make aliases relative so that test work on all computers
    const relativeAliases = mapValues(aliases, (a) =>
      posixPath(path.relative(props.siteDir, a)),
    );
    expect(relativeAliases).toMatchSnapshot();
  });

  test('should use svg rule', () => {
    const fileLoaderUtils = utils.getFileLoaderUtils();
    const mockSvg = jest.spyOn(fileLoaderUtils.rules, 'svg');
    jest
      .spyOn(utils, 'getFileLoaderUtils')
      .mockImplementation(() => fileLoaderUtils);

    createBaseConfig(props, false, false);
    expect(mockSvg).toBeCalled();
  });
});
