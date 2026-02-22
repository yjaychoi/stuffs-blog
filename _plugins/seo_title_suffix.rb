# frozen_string_literal: true

module StuffsBlog
  module SeoTitleSuffix
    def page_title
      return @stuffs_page_title if defined?(@stuffs_page_title)

      base_title = super
      @stuffs_page_title = append_site_name(base_title)
    end

    def title
      @stuffs_title ||= begin
        if site_description && site_title && page_title == site_title
          site_title + self.class::TITLE_SEPARATOR + site_tagline_or_description
        else
          page_title || site_title
        end
      end

      return page_number + @stuffs_title if page_number

      @stuffs_title
    end

    private

    def append_site_name(base_title)
      return base_title unless base_title
      return base_title if root_page?
      return base_title unless site_title

      suffix = self.class::TITLE_SEPARATOR + site_title
      return base_title if base_title.end_with?(suffix)

      base_title + suffix
    end

    def root_page?
      url = page["url"].to_s
      url.empty? || url == "/" || url == "/index.html"
    end
  end
end

Jekyll::Hooks.register :site, :after_init do
  next unless defined?(Jekyll::SeoTag::Drop)
  next if Jekyll::SeoTag::Drop.ancestors.include?(StuffsBlog::SeoTitleSuffix)

  Jekyll::SeoTag::Drop.prepend(StuffsBlog::SeoTitleSuffix)
end
