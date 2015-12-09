import tar from 'tar-fs'
import mkdirp from 'mkdirp'
import gunzip from 'gunzip-maybe'
import { get } from 'request'

function getPackage(tarballURL, outputDir, callback) {
  mkdirp(outputDir, function (error) {
    
    if (error) {
      callback(error)
    } else {
      let callbackCalled = false

      get({ url: tarballURL })
        .pipe(gunzip())
        .pipe(tar.extract(outputDir, {
          map: function (header) {
            header.name = header.name.replace(/^package\//, '')
            return header
          }
        }))
        .on('finish', callback)
        .on('error', function (error) {
          if (!callbackCalled) // LOL request
            callback(error)

          callbackCalled = true
        })
    }
  })
}

export default getPackage
