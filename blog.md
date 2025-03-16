---
layout: page
title: Blog
permalink: /blog/
---

# Blog Posts

{% for post in site.posts %}
  <div class="post-preview">
    <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
    <p class="post-meta">{{ post.date | date: "%B %d, %Y" }}</p>
    
    {% if post.categories.size > 0 %}
    <p class="post-categories">
      Categories:
      {% for category in post.categories %}
        <span class="category-tag">{{ category }}</span>
      {% endfor %}
    </p>
    {% endif %}
    
    {% if post.tags.size > 0 %}
    <p class="post-tags">
      Tags:
      {% for tag in post.tags %}
        <span class="tag">{{ tag }}</span>
      {% endfor %}
    </p>
    {% endif %}
    
    <p>{{ post.excerpt }}</p>
    <a href="{{ post.url | relative_url }}" class="read-more-link">Read More</a>
  </div>
  <hr>
{% endfor %} 