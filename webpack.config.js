const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');


module.exports = {
  mode: 'production', // Режим сборки
  entry: './src/js/index.js', // Главный входной JS-файл
  output: {
    filename: 'bundle.[contenthash].js', // Файл с хэшем
    path: path.resolve(__dirname, 'dist'),
    assetModuleFilename: 'assets/[hash][ext][query]', // Настройка файлов (картинки)
  },
  externals: {
    jquery: 'jQuery',
  },
  module: {
    rules: [
      {
        test: /\.css$/, // Подключение CSS
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.js$/, // Компиляция JS
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|webp)$/i, // Подключение изображений
        type: 'asset/resource',
        generator: {
          filename: "assets/images/[name][ext]" // Указываем, куда сохранять
        }
      },
      {
        test: /\.html$/,
        use: ['html-loader']
      }
    ],
  },
  optimization: {
    minimize: true, // Минификация JS и CSS
    minimizer: [new TerserPlugin(), new CssMinimizerPlugin()],
  },
  plugins: [
    new CleanWebpackPlugin(), // Очистка dist перед сборкой
    new HtmlWebpackPlugin({
      template: './src/index.html', // Использование оригинального HTML
      inject: 'body',
      minify: {
        collapseWhitespace: true,
        removeComments: true,
      },
    }),
    new MiniCssExtractPlugin({
      filename: 'styles.[contenthash].css', // Выходной CSS-файл
    }),
    new CopyWebpackPlugin({
        patterns: [
          { from: "src/json", to: "json" } // Копируем JSON-файлы в dist/json
        ],
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/assets/images', to: 'assets/images' } // Копируем JSON-файлы в dist/json
      ],
  }),
  ],
};
