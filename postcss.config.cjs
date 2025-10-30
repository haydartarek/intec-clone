module.exports = ({ env }) => ({
  map: false,
  plugins: [
    require('autoprefixer')(),
    env === 'production' ? require('cssnano')({ preset: 'default' }) : null
  ].filter(Boolean)
});
