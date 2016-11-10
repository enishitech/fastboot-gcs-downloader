const path    = require('path');
const storage = require('@google-cloud/storage');
const fsp     = require('fs-promise');
const {exec}  = require('mz/child_process');

function fetchCurrentVersion(ui, configFile) {
  ui.writeLine(`fetching current app version from ${configFile.bucket.name}/${configFile.name}`);

  return configFile.download().then(([buffer]) => {
    const config = JSON.parse(buffer.toString());

    ui.writeLine('got config', config);

    return config;
  });
}

function removeOldApp(ui, outputPath) {
  ui.writeLine(`removing ${outputPath}`);

  return fsp.remove(outputPath);
}

function downloadAppZip(ui, zipFile, zipPath) {
  ui.writeLine(`saving Cloud Storage object ${zipFile.bucket.name}/${zipFile.name} to ${zipPath}`);

  return zipFile.download({destination: zipPath});
}

function unzipApp(ui, zipPath) {
  return execute(ui, `unzip ${zipPath}`).then(() => {
    ui.writeLine(`unzipped ${zipPath}`);
  });
}

function installDependencies(ui, outputPath) {
  return fsp.access(path.join(outputPath, 'yarn.lock')).then(() => {
    return execute(ui, `cd ${outputPath} && yarn install --prefer-offline`);
  }, () => {
    return execute(ui, `cd ${outputPath} && npm install`);
  }).then(() => {
    ui.writeLine('installed dependencies');
  }).catch(() => {
    ui.writeError('unable to install dependencies');
  });
}

function execute(ui, command) {
  return exec(command).catch((stdout, stderr) => {
    ui.writeError(`error running command ${command}`);
    ui.writeError(stderr);
  });
}

function outputPathFor(zipPath) {
  const name = path.basename(zipPath, '.zip');

  // Remove MD5 hash
  return name.split('-').slice(0, -1).join('-');
}

class AppNotFoundError extends Error {
  constructor() {
    super(...arguments);

    this.name = 'AppNotFoundError';
  }
}

class GCSDownloader {
  constructor({bucket, key, authentication} = {}) {
    this.configBucket   = bucket;
    this.configKey      = key;
    this.authentication = authentication;
  }

  download() {
    const gcs        = storage(this.authentication);
    const configFile = gcs.bucket(this.configBucket).file(this.configKey);

    return fetchCurrentVersion(this.ui, configFile).then(({bucket: appBucket, key: appKey}) => {
      const zipFile    = gcs.bucket(appBucket).file(appKey);
      const zipPath    = path.basename(zipFile.name);
      const outputPath = outputPathFor(zipPath);

      return removeOldApp(this.ui, outputPath).then(() => {
        return downloadAppZip(this.ui, zipFile, zipPath);
      }).then(() => {
        return unzipApp(this.ui, zipPath);
      }).then(() => {
        return installDependencies(this.ui, outputPath);
      }).then(() => outputPath);
    });
  }
}

module.exports = GCSDownloader;
