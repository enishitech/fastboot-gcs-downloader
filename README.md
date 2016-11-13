# FastBoot Google Cloud Storage Downloader

Google Cloud Storage downloader of [Ember Fastboot App Server](https://github.com/ember-fastboot/fastboot-app-server).

``` js
const FastBootAppServer = require('fastboot-app-server');
const GCSDownloader     = require('fastboot-gcs-downloader');

const downloader = new GCSDownloader({
  bucket: 'bucket-name',
  key: 'path/to/fastboot-deploy-info.json',
  authentication: {
    projectId: 'project-id',
    keyFilename: 'path/to/key'
  }
});

new FastBootAppServer({
  downloader
}).start();
```

Normally this will be used with [fastboot-gcs-notifier](https://github.com/ursm/fastboot-gcs-notifier).

## Configuration Options

### `bucket` (required)

The name of the bucket that contains `fastboot-deploy-info.json`.

### `key` (optional)

If `fastboot-deploy-info.json` is stored in a different name or subdirectory, specify this option.

Default: `fastboot-deploy-info.json`

### `authentication` (optional)

Google Cloud Storage authentication configuration object. This requires the following properties.

#### `projectId` (optional)

Project ID of Google Cloud Platform. You can use the `GCLOUD_PROJECT` environment variable instead.

#### `keyFilename` (optional)

Path to .json, .pem or .p12 key file. You can use the `credentials` option below or the `GOOGLE_APPLICATION_CREDENTIALS` environment variable instead.

#### `credentials` (optional)

Object with `client_email` and `private_key` properties. You can use the above `keyFilename` option or the `GOOGLE_APPLICATION_CREDENTIALS` environment variable instead.

See [Google Cloud Node.js documentation](https://googlecloudplatform.github.io/google-cloud-node/#/docs/google-cloud/guides/authentication) for details on authentication.
