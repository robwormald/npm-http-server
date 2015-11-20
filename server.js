/*eslint-disable no-console */
require('babel-core/register')

var express = require('express')
//var npm = require('npm');
var serveNPMPackageFile = require('./modules/serveNPMPackageFile').default
var port = process.env.PORT || process.env.npm_package_config_port
var app = express()
var installNpmModules = require('./modules/bundler').installNpmModules
var requestNpmPackage = require('./modules/bundler').requestNpmPackage
var checkIfBundleExists = require('./modules/bundler').checkIfBundleExists
var buildWithWebpack = require('./modules/bundler').buildWithWebpack
var deleteModules = require('./modules/bundler').deleteModules

app.disable('x-powered-by')
app.set('view engine', 'ejs')
app.use(express.static('public', { maxAge: 60000 }))

app.get('/package/:name', function (req, res) {
  var packageName = req.params.name
  var packageInstallPath = `${__dirname}/packages`
  var packageToCamelcase = packageName.replace(/-([a-z])/g, g => g[1].toUpperCase())
  requestNpmPackage(res, packageName, body => {
    var registeryObject = body
    var latestVersion = registeryObject['dist-tags'].latest
    var config = {
      prefix: `${packageInstallPath}/modules`
    }
    var bundlePath = `/packages/${packageName}/${latestVersion}/bundle.js`
    var existsPath = `${packageInstallPath}/${packageName}/${latestVersion}`
    var entry = `${packageInstallPath}/modules/node_modules/${packageName}/${registeryObject.versions[latestVersion].main}`
    var outPath = `${packageInstallPath}/${packageName}/${latestVersion}`
    var deletePath = `${packageInstallPath}/modules`
    checkIfBundleExists(res, existsPath, bundlePath, packageToCamelcase, () => {
      installNpmModules(res, packageName, config, () => {
        buildWithWebpack(res, packageInstallPath, entry, packageToCamelcase, outPath, () => {
          deleteModules(res, deletePath, () => {
            res.render('package',  {
              path: bundlePath,
              name: packageToCamelcase
            })
          })
        })
      })
    })
  })
})

//Serve our bundles
app.use('/packages', express.static('packages'))

app.use(serveNPMPackageFile)
app.listen(port, function () {
  console.log('Server started on port ' + port + '. Ctrl+C to quit')
})
