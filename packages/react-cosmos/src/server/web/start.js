// @flow

import { silent as silentImport } from 'import-from';
import {
  getCosmosConfig,
  hasUserCosmosConfig,
  generateCosmosConfig
} from 'react-cosmos-config';
import { getUserWebpackConfig } from './webpack/user-webpack-config';
import {
  createServerApp,
  createServer,
  serveStaticDir,
  attachStackFrameEditorLauncher
} from '../shared/server';
import { attachSockets } from '../shared/socket';
import { attachWebpack } from './webpack/attach-webpack';
import openFilePlugin from './plugins/openFile';
import { getPlaygroundOpts } from './playground-opts';

export async function startServer() {
  if (!hasUserCosmosConfig()) {
    const generatedConfigFor = generateCosmosConfig();
    if (generatedConfigFor) {
      console.log(`[Cosmos] Nice! You're using ${generatedConfigFor}`);
      console.log('[Cosmos] Generated a tailored config file for your setup');
    }
  }

  const cosmosConfig = getCosmosConfig();
  const { next, rootPath, publicUrl } = cosmosConfig;

  if (cosmosConfig.proxies) {
    console.warn('[Cosmos] Warning: config.proxies is deprecated!');
    console.warn(
      'Please check latest proxy docs: https://github.com/react-cosmos/react-cosmos#proxies'
    );
  }

  const webpack = silentImport(rootPath, 'webpack');
  if (!webpack) {
    console.warn('[Cosmos] webpack dependency missing!');
    console.log('Install using "yarn add webpack" or "npm install webpack"');

    return () => {};
  }

  const userWebpackConfig = getUserWebpackConfig(cosmosConfig);
  const app = createServerApp({
    cosmosConfig,
    playgroundOpts: getPlaygroundOpts(cosmosConfig)
  });
  const { server, startServer, stopServer } = createServer(cosmosConfig, app);

  const publicPath = getPublicPath(cosmosConfig, userWebpackConfig);
  if (publicPath) {
    serveStaticDir(app, publicUrl, publicPath);
  }

  attachStackFrameEditorLauncher(app);

  if (next) {
    openFilePlugin({ app, cosmosConfig });
  }

  const { onWebpackDone, stopWebpack } = attachWebpack({
    cosmosConfig,
    app,
    webpack,
    userWebpackConfig
  });

  const closeSockets = next ? attachSockets(server) : () => {};
  await startServer();
  await onWebpackDone;

  return async () => {
    await stopWebpack();
    closeSockets();
    await stopServer();
  };
}

function getPublicPath(cosmosConfig, webpackConfig) {
  return (
    cosmosConfig.publicPath ||
    (webpackConfig.devServer && webpackConfig.devServer.contentBase)
  );
}
