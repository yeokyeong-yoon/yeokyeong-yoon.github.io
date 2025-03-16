---
layout: page
title: Projects
permalink: /projects/
---

# My Projects

Below are some of the projects I've worked on. Each project includes a description, technologies used, and links to the source code or live demos when available.

{% for project in site.projects %}
  <div class="project-card">
    <h2><a href="{{ project.url | relative_url }}">{{ project.title }}</a></h2>
    <p class="project-meta">{{ project.date | date: "%B %d, %Y" }}</p>
    <p>{{ project.description }}</p>
    
    {% if project.technologies %}
    <p class="technologies">
      Technologies:
      {% for tech in project.technologies %}
        <span class="tech-tag">{{ tech }}</span>
      {% endfor %}
    </p>
    {% endif %}
    
    <p class="project-links">
      {% if project.github_link %}
        <a href="{{ project.github_link }}" class="btn" target="_blank">View on GitHub</a>
      {% endif %}
      
      {% if project.demo_link %}
        <a href="{{ project.demo_link }}" class="btn" target="_blank">Live Demo</a>
      {% endif %}
      
      <a href="{{ project.url | relative_url }}" class="btn">Read More</a>
    </p>
  </div>
  <hr>
{% endfor %} 