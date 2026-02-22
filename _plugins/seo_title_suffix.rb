# frozen_string_literal: true

module StuffsBlog
  module SeoTitleSuffix
    TITLE_SEPARATOR = " | ".freeze

    module_function

    def apply_social_title_suffix(output:, page_url:, site_title:)
      return output unless output.is_a?(String)
      return output if site_title.to_s.empty?
      return output if root_page?(page_url)

      with_og = append_suffix(output, property: "og:title", site_title:)
      append_suffix(with_og, property: "twitter:title", site_title:)
    end

    def assign_post_description_from_summary(document)
      return unless document.collection.label == "posts"

      summary = document.data["summary"]
      return unless summary.is_a?(String)

      trimmed = summary.strip
      return if trimmed.empty?

      document.data["description"] = trimmed
    end

    def append_suffix(output, property:, site_title:)
      suffix = TITLE_SEPARATOR + site_title
      pattern = /(<meta\s+property="#{Regexp.escape(property)}"\s+content=")([^"]*)(".*?>)/

      output.gsub(pattern) do
        prefix = Regexp.last_match(1)
        current_title = Regexp.last_match(2)
        postfix = Regexp.last_match(3)

        next Regexp.last_match(0) if current_title.empty? || current_title.end_with?(suffix)

        "#{prefix}#{current_title}#{suffix}#{postfix}"
      end
    end

    def root_page?(page_url)
      normalized = page_url.to_s
      normalized.empty? || normalized == "/" || normalized == "/index.html"
    end

    def html_output?(item)
      item.respond_to?(:output_ext) && item.output_ext == ".html"
    end
  end
end

Jekyll::Hooks.register :documents, :pre_render do |document|
  StuffsBlog::SeoTitleSuffix.assign_post_description_from_summary(document)
end

Jekyll::Hooks.register :pages, :post_render do |page|
  next unless StuffsBlog::SeoTitleSuffix.html_output?(page)

  page.output = StuffsBlog::SeoTitleSuffix.apply_social_title_suffix(
    output: page.output,
    page_url: page.url,
    site_title: page.site.config["title"]
  )
end

Jekyll::Hooks.register :documents, :post_render do |document|
  next unless StuffsBlog::SeoTitleSuffix.html_output?(document)

  document.output = StuffsBlog::SeoTitleSuffix.apply_social_title_suffix(
    output: document.output,
    page_url: document.url,
    site_title: document.site.config["title"]
  )
end
