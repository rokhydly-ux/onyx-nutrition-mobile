module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',
      'nativewind/babel'
    ],
    plugins: [
      '@babel/plugin-transform-typescript', // <-- DOIT IMPÉRATIVEMENT ÊTRE EN PREMIER !
      ['@babel/plugin-transform-class-properties', { loose: true }],
      ['@babel/plugin-transform-private-methods', { loose: true }]
    ],
  };
};