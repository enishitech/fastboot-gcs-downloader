# FastBoot Google Cloud Storage Downloader

``` js
const GCSDownloader = require('fastboot-gcs-downloader');

const downloader = new GCSDownloader({
  bucket: 'bucket-name',                    // required
  key: 'path/to/fastboot-deploy-info.json', // required
  authentication: {                         // optional; see below
    projectId: 'project-id',
    keyFilename: 'path/to/key'
  }
});
```

For details on authentication, see [Google Cloud Node.js documentation](https://googlecloudplatform.github.io/google-cloud-node/#/docs/google-cloud/guides/authentication).
