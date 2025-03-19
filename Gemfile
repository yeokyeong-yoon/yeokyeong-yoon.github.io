source "https://rubygems.org"

# Specify Ruby version
ruby "3.1.4"

# Use GitHub Pages gem for compatibility
gem "github-pages", group: :jekyll_plugins

# Theme
gem "minima", "~> 2.5"

# Common plugins already included in github-pages gem
group :jekyll_plugins do
  gem "jekyll-feed"
  gem "jekyll-seo-tag"
  gem "jekyll-sitemap"
  gem "jekyll-remote-theme"
  gem 'jekyll-incremental'
  gem 'jekyll-livereload'
end

# Fix version conflicts
gem 'forwardable-extended', '~> 2.6.0'
gem 'liquid-tag-parser', '~> 1.9.0'

# Windows and JRuby does not include zoneinfo files, so bundle the tzinfo-data gem
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1.2.10"
  gem "tzinfo-data"
end

# Performance-booster for watching directories on Windows
gem "wdm", "~> 0.1.1", :platforms => [:mingw, :x64_mingw, :mswin]

# Webrick is no longer bundled with Ruby 3.0+
gem "webrick", "~> 1.8"

gem "jekyll", "~> 3.9.5"
gem "jekyll-theme-minima"
gem "kramdown-parser-gfm"
gem "faraday-retry" 