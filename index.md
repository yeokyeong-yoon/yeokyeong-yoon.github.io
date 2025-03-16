---
layout: home
title: Home
---

# Welcome to My GitHub Blog

Hello! This is my personal blog where I share details about my projects, career journey, and technical insights.

## Latest Posts

{% for post in site.posts limit:5 %}
  <div class="post-preview">
    <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
    <p class="post-meta">{{ post.date | date: "%B %d, %Y" }}</p>
    <p>{{ post.excerpt }}</p>
    <a href="{{ post.url | relative_url }}">Read More</a>
  </div>
  <hr>
{% endfor %}

## Featured Projects

{% for project in site.projects limit:3 %}
  <div class="project-card">
    <h3><a href="{{ project.url | relative_url }}">{{ project.title }}</a></h3>
    <p>{{ project.description }}</p>
    <p><a href="{{ project.github_link }}" target="_blank">View on GitHub</a></p>
  </div>
{% endfor %} 