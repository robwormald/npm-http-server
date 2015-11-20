const npm = require('npm')
var request = require('request')
var fs = require('fs')
var webpack = require('webpack')
var rimraf = require('rimraf')

export function checkIfBundleExists(res, path, verion, packageToCamelcase, callback) {
  fs.exists(path, exists => {
    if (!exists) {
      callback()
    }else {
      res.render('package',  {
        path: verion,
        name: packageToCamelcase
      })
    }
  })
}

export function requestNpmPackage(res, packageName, callback) {
  request(`https://registry.npmjs.org/${packageName}`, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      return callback(JSON.parse(body))
    }else {
      return res.status(404).send(`Server error: Unable to retrieve info for package ${packageName}`)
    }
  })
}

export function installNpmModules(res, name, config, callback) {
  return npm.load(config, function (er) {
    if (er) {
      return res.status(500).send(`Server error: where was en error retrieving ${name} from npm`)
    }
    npm.commands.install([ name ], function (er) {
      if (er) {
        return res.status(500).send(`Server error: There was an error installing ${name}`)
      }
      callback()
    })
  })
}

export function buildWithWebpack(res, packageInstallPath, entry, packageToCamelcase, outPath, callback) {
  var config = {
    context: packageInstallPath,
    entry: entry,
    output: {
      library: packageToCamelcase,
      libraryTarget: 'var',
      path: outPath
    },
    resolve: {
      extensions: [ '', '.js' ]
    },
    plugins: [
      new webpack.optimize.OccurenceOrderPlugin(),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production')
      }),
      new webpack.optimize.UglifyJsPlugin({
        compressor: {
          screw_ie8: true,
          warnings: false
        }
      })
    ]
  }
  webpack(config, (err) => {
    if (err) {
      return res.status(500).send(`Server error: Someone was probably building a library at the same time, try again! :D`)
    }else {
      callback()
    }
  })
}

export function deleteModules(res, path, callback) {
  rimraf(path, error => {
    if (error) {
      return res.status(500).send(`Server error: deleting the modules`)
    }
    callback()
  })
}
