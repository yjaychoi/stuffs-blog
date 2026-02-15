# frozen_string_literal: true
require "cgi"

module StuffOfThoughts
  class RedirectsGenerator < Jekyll::Generator
    safe true
    priority :low

    def generate(site)
      redirects = site.data.fetch("redirects", [])
      seen = {}

      redirects.each do |entry|
        from = entry.fetch("from").to_s.strip
        to = entry.fetch("to").to_s.strip

        raise "Redirect 'from' must start with '/' (got: #{from})" unless from.start_with?("/")
        raise "Redirect 'to' must start with '/' or 'https://' (got: #{to})" unless to.start_with?("/") || to.start_with?("https://")

        if seen[from]
          raise "Duplicate redirect mapping detected for '#{from}'"
        end

        seen[from] = true

        # Root route should remain the real home page.
        next if from == "/"

        dir = from.delete_prefix("/").sub(%r{/$}, "")
        page = Jekyll::PageWithoutAFile.new(site, site.source, dir, "index.html")
        page.content = redirect_html(from, to)
        page.data["layout"] = nil
        page.data["sitemap"] = false
        site.pages << page
      end
    end

    private

    def redirect_html(source_path, destination)
      escaped_destination = CGI.escapeHTML(destination)
      escaped_source = CGI.escapeHTML(source_path)
      <<~HTML
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta http-equiv="refresh" content="0;url=#{escaped_destination}">
            <meta name="robots" content="noindex,follow">
            <link rel="canonical" href="#{escaped_destination}">
            <title>Redirecting...</title>
          </head>
          <body>
            <p>Redirecting from #{escaped_source} to <a href="#{escaped_destination}">#{escaped_destination}</a>.</p>
          </body>
        </html>
      HTML
    end
  end
end
