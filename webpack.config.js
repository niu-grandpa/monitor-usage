const path = require('path');

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'monitor-usage.js',
    environment: {
      arrowFunction: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [['@babel/preset-env']],
            },
          },
          'ts-loader',
        ],
        exclude: /node-modules/,
      },
    ],
  },

  resolve: {
    extensions: ['.ts', '.js'],
  },
};
