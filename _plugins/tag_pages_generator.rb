# frozen_string_literal: true

module StuffOfThoughts
  class TagDetailPage < Jekyll::Page
    def initialize(site, base, dir, tag_name, tag_slug, posts)
      @site = site
      @base = base
      @dir = dir
      @name = "index.html"

      process(@name)
      read_yaml(File.join(base, "_layouts"), "tag_detail.html")

      ordered_posts = posts.sort_by do |post|
        [-post.date.to_i, post.data.fetch("post_uid", "").to_s]
      end

      data["title"] = "Tag: #{tag_name}"
      data["tag_name"] = tag_name
      data["tag_slug"] = tag_slug
      data["posts"] = ordered_posts
      data["permalink"] = "/tags/#{tag_slug}/"
    end
  end

  class TagPagesGenerator < Jekyll::Generator
    safe true
    priority :low

    def generate(site)
      tag_index = Hash.new { |hash, key| hash[key] = [] }

      site.posts.docs.each do |post|
        Array(post.data["tags"]).each do |tag|
          tag_index[tag.to_s] << post
        end
      end

      overrides = site.data.fetch("tag_slugs", {})
      slug_claims = {}

      tag_index.each do |tag_name, posts|
        normalized = tag_name.unicode_normalize(:nfkc).downcase.strip.gsub(/\s+/, " ")
        explicit_slug = overrides[tag_name] || overrides[normalized]
        slug = explicit_slug || Jekyll::Utils.slugify(normalized, mode: "pretty")

        owner = slug_claims[slug]
        if owner && owner != tag_name
          raise "Tag slug collision detected: '#{tag_name}' and '#{owner}' both resolve to '#{slug}'."
        end

        slug_claims[slug] = tag_name
        site.pages << TagDetailPage.new(site, site.source, File.join("tags", slug), tag_name, slug, posts)
      end

      site.config["generated_tag_slug_map"] = slug_claims
    end
  end
end
