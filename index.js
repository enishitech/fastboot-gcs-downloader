const path    = require('path');
const {exec}  = require('child_process');
const storage = require('@google-cloud/storage');
const fsp     = require('fs-promise');

function AppNotFoundError() {
  const error = new Error(...arguments);

  error.name = 'AppNotFoundError';

  return error;
}

function fetchCurrentVersion(ui, gcs, bucketName, fileName) {
  ui.writeLine(`fetching current app version from ${bucketName}/${fileName}`);

  return gcs.bucket(bucketName).file(fileName).download().then(([buffer]) => {
    const config = JSON.parse(buffer.toString());

    ui.writeLine('got config', config);

    return config;
  });
}

function removeOldApp(ui, outputPath) {
  ui.writeLine(`removing ${outputPath}`);

  return fsp.remove(outputPath);
}

function downloadAppZip(ui, gcs, bucketName, fileName, zipPath) {
  ui.writeLine(`saving Cloud Storage object ${bucketName}/${fileName} to ${zipPath}`);

  return gcs.bucket(bucketName).file(fileName).download({destination: zipPath});
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
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        ui.writeError(`error running command ${command}`);
        ui.writeError(stderr);

        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function outputPathFor(zipPath) {
  const name = path.basename(zipPath, '.zip');

  // Remove MD5 hash
  return name.split('-').slice(0, -1).join('-');
}

class GCSDownloader {
  constructor({bucket, key, authentication} = {}) {
    this.configBucket = bucket;
    this.configKey    = key;
    this.gcs          = storage(authentication);
  }

  download() {
    if (!this.configBucket || !this.configKey) {
      this.ui.writeError('no Cloud Storage bucket or key provided; not downloading app');

      return Promise.reject(AppNotFoundError());
    }

    return fetchCurrentVersion(this.ui, this.gcs, this.configBucket, this.configKey).then(({bucket: appBucket, key: appKey}) => {
      const zipPath    = path.basename(appKey);
      const outputPath = outputPathFor(zipPath);

      return removeOldApp(this.ui, outputPath).then(() => {
        return downloadAppZip(this.ui, this.gcs, appBucket, appKey, zipPath);
      }).then(() => {
        return unzipApp(this.ui, zipPath);
      }).then(() => {
        return installDependencies(this.ui, outputPath);
      }).then(() => outputPath);
    });
  }
}

module.exports = GCSDownloader;
