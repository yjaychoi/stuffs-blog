# frozen_string_literal: true

require "time"

module DeterministicFilters
  def deterministic_post_sort(posts)
    Array(posts).sort_by do |post|
      timestamp = if post.respond_to?(:date) && post.date
                    post.date.to_i
                  elsif post.respond_to?(:data) && post.data["date"]
                    Time.parse(post.data["date"].to_s).to_i
                  else
                    0
                  end
      post_uid = if post.respond_to?(:data)
                   post.data.fetch("post_uid", "")
                 else
                   ""
                 end.to_s

      [-timestamp, post_uid]
    end
  end

  def deterministic_tag_sort(tags)
    Array(tags).map(&:to_s).sort_by do |tag|
      normalize_tag_text(tag)
    end
  end

  def tag_names(tag_hash)
    return [] unless tag_hash.respond_to?(:keys)

    tag_hash.keys.map(&:to_s)
  end

  def published_before(posts, cutoff)
    cutoff_epoch = Time.parse(cutoff.to_s).to_i
    Array(posts).select do |post|
      next false unless post.respond_to?(:date) && post.date

      post.date.to_i <= cutoff_epoch
    end
  rescue StandardError
    Array(posts)
  end

  def reading_time(rendered_html, words_per_minute = 220)
    word_count = rendered_html.to_s.gsub(%r{<[^>]+>}, " ").scan(/[[:word:]]+/).size
    minutes = (word_count / words_per_minute.to_f).ceil
    minutes = 1 if minutes < 1
    "#{minutes} min read"
  end

  def canonical_tag_slug(tag)
    site = @context.registers[:site]
    overrides = site.data.fetch("tag_slugs", {})
    key = tag.to_s
    normalized = normalize_tag_text(key)

    override = overrides[key] || overrides[normalized]
    return override.to_s if override

    Jekyll::Utils.slugify(normalized, mode: "pretty")
  end

  private

  def normalize_tag_text(value)
    value.to_s.unicode_normalize(:nfkc).downcase.strip.gsub(/\s+/, " ")
  rescue StandardError
    value.to_s.downcase.strip.gsub(/\s+/, " ")
  end
end

Liquid::Template.register_filter(DeterministicFilters)
