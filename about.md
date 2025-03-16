---
layout: page
title: About
permalink: /about/
---

<style>
  body {
    margin: 0;
    padding: 0;
    font-family: sohne, "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: rgba(0, 0, 0, 0.8);
    background-color: #fff;
  }
  
  .about-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 120px 24px;
  }
  
  .intro {
    margin-bottom: 120px;
    max-width: 800px;
  }
  
  .page-heading {
    font-size: 7em;
    font-weight: 800;
    letter-spacing: -0.05em;
    line-height: 0.9;
    margin: 0 0 40px;
    color: #000;
  }
  
  .intro-text {
    font-size: 2.2em;
    line-height: 1.3;
    color: rgba(0, 0, 0, 0.7);
    margin-bottom: 60px;
    max-width: 640px;
    font-weight: 400;
  }
  
  .quick-links {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    margin-top: 60px;
  }
  
  .quick-link {
    display: inline-block;
    padding: 12px 24px;
    color: rgba(0, 0, 0, 0.6);
    text-decoration: none;
    transition: all 0.2s ease;
    font-size: 18px;
    font-weight: 400;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 99px;
  }
  
  .quick-link:hover {
    background: rgba(0, 0, 0, 0.03);
    color: rgba(0, 0, 0, 0.8);
  }
  
  .quick-link.notion-link {
    background: #000;
    color: white;
    border: none;
  }
  
  .quick-link.notion-link:hover {
    background: #333;
  }
  
  .section-heading {
    font-size: 3em;
    margin: 100px 0 50px;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: #000;
  }
  
  .content-section {
    font-size: 1.3em;
    line-height: 1.6;
    color: rgba(0, 0, 0, 0.8);
    margin-bottom: 80px;
    max-width: 740px;
  }
  
  .content-section h3 {
    font-size: 2em;
    margin: 60px 0 30px;
    font-weight: 700;
    color: #000;
    letter-spacing: -0.02em;
  }
  
  .content-section p {
    margin-bottom: 30px;
  }
  
  .content-section ul {
    padding-left: 20px;
    margin-bottom: 30px;
  }
  
  .content-section li {
    margin-bottom: 15px;
  }
  
  .post-list-item {
    margin-bottom: 25px;
  }
  
  .post-list-item a {
    color: #000;
    text-decoration: none;
    font-weight: 500;
    font-size: 1.2em;
    transition: color 0.2s ease;
  }
  
  .post-list-item a:hover {
    color: rgba(0, 0, 0, 0.6);
  }
  
  .post-date {
    color: rgba(0, 0, 0, 0.54);
    font-size: 0.9em;
    display: block;
    margin-top: 5px;
  }
  
  .view-all {
    display: inline-block;
    margin-top: 20px;
    color: #000;
    font-weight: 500;
    text-decoration: none;
    font-size: 1.1em;
    transition: color 0.2s ease;
  }
  
  .view-all:hover {
    color: rgba(0, 0, 0, 0.6);
  }
  
  @media (max-width: 768px) {
    .page-heading {
      font-size: 5em;
    }
    
    .intro-text {
      font-size: 1.8em;
    }
    
    .about-page {
      padding: 80px 24px;
    }
  }
</style>

<div class="about-page">
  <section class="intro">
    <h1 class="page-heading">yeokyeong.yoon</h1>
    <p class="intro-text">Software developer sharing insights about system design and development experiences</p>
    <div class="quick-links">
      <a href="{{ site.baseurl }}/blog" class="quick-link">Blog</a>
      <a href="{{ site.baseurl }}/tags" class="quick-link">Tags</a>
      <a href="https://polished-chicken-aca.notion.site/Yeokyeong-Yoon-19a67bf8bfe280519aaaf36d8d299044" class="quick-link notion-link" target="_blank">Portfolio</a>
    </div>
  </section>

  <section class="content-section">
    <h2 class="section-heading">About Me</h2>
    
    <p>I'm a software developer with a passion for building elegant, efficient systems. My expertise lies in backend development, system design, and creating scalable solutions for complex problems.</p>
    
    <h3>Experience</h3>
    <p>I've worked on various projects ranging from e-commerce platforms to content management systems. My focus has been on creating robust architectures that can handle high traffic and complex business logic.</p>
    
    <h3>Skills</h3>
    <ul>
      <li>Backend Development: Java, Spring Framework, Node.js</li>
      <li>System Design: Microservices, Event-driven architecture</li>
      <li>Database: SQL, NoSQL, Data modeling</li>
      <li>DevOps: CI/CD, Docker, Kubernetes</li>
    </ul>
    
    <h3>Current Focus</h3>
    <p>I'm currently exploring distributed systems and how to design resilient applications that can scale effectively. I'm also interested in performance optimization and how to make systems more efficient.</p>
  </section>

  <section class="content-section">
    <h2 class="section-heading">Latest Posts</h2>
    <ul style="list-style-type: none; padding: 0;">
      {% for post in site.posts limit:3 %}
        <li class="post-list-item">
          <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
          <span class="post-date">{{ post.date | date: "%Y년 %m월 %d일" }}</span>
        </li>
      {% endfor %}
    </ul>
    <a href="{{ site.baseurl }}/blog" class="view-all">View all posts →</a>
  </section>
</div>