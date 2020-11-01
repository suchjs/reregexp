const path = require('path');

module.exports = {
  entry: './browser.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules|__tests__|lib|dist/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'reregexp.min.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
