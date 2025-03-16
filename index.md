---
layout: home
---

<div class="intro-section">
  <h1>Welcome to My Blog</h1>
  <p class="lead">I write about projects, career insights, and technical topics. Explore my work below.</p>
</div>

## Latest Posts

<div class="posts-grid">
  {% for post in site.posts limit:3 %}
    <div class="post-card">
      <span class="post-date">{{ post.date | date: "%b %-d, %Y" }}</span>
      <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
      
      {% if post.categories.size > 0 %}
        <div class="post-categories">
          {% for category in post.categories %}
            <span class="category-tag">{{ category }}</span>
          {% endfor %}
        </div>
      {% endif %}
      
      <p class="post-excerpt">{{ post.excerpt | strip_html | truncatewords: 30 }}</p>
      <a href="{{ post.url | relative_url }}" class="read-more">Read More →</a>
    </div>
  {% endfor %}
</div>

## Featured Projects

<div class="projects-grid">
  {% for project in site.projects limit:2 %}
    <div class="project-card">
      <h2><a href="{{ project.url | relative_url }}">{{ project.title }}</a></h2>
      <p>{{ project.description }}</p>
      
      {% if project.technologies %}
        <div class="technologies">
          {% for tech in project.technologies %}
            <span class="tech-tag">{{ tech }}</span>
          {% endfor %}
        </div>
      {% endif %}
      
      <div class="project-links">
        {% if project.github_link %}
          <a href="{{ project.github_link }}" class="btn" target="_blank">View on GitHub</a>
        {% endif %}
        <a href="{{ project.url | relative_url }}" class="btn">Read More</a>
      </div>
    </div>
  {% endfor %}
</div>

<div class="view-all-section">
  <a href="/blog/" class="btn">View All Posts</a>
  <a href="/projects/" class="btn">View All Projects</a>
</div> 