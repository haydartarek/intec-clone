module.exports = ({ env }) => ({
  map: false,
  plugins: [
    require('autoprefixer')(),
    env === 'production'
      ? require('@fullhuman/postcss-purgecss')({
          content: ['./*.html', './intec-clone/*.html'],
          defaultExtractor: content => content.match(/[^\s"'<>]+/g) || []
        })
      : null,
    env === 'production' ? require('cssnano')({ preset: 'default' }) : null
  ].filter(Boolean)
});
