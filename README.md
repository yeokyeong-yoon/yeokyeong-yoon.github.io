# My GitHub Blog

This repository contains my personal GitHub Pages blog, where I share information about my projects and career.

## Setup and Installation

### Local Development

To run this blog locally for development:

1. Install Jekyll and Bundler:
   ```
   gem install jekyll bundler
   ```

2. Clone this repository:
   ```
   git clone https://github.com/yeokyeong-yoon/yeokyeong-yoon.github.io.git
   cd yeokyeong-yoon.github.io
   ```

3. Install dependencies:
   ```
   bundle install
   ```

4. Run the Jekyll server:
   ```
   bundle exec jekyll serve
   ```

5. Visit `http://localhost:4000` in your browser to see the blog.

### Deployment to GitHub Pages

1. Create a repository named `yeokyeong-yoon.github.io` on GitHub.
2. Push your code to the repository:
   ```
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```
3. Your blog will be available at `https://yeokyeong-yoon.github.io`.

## Adding Content

### Blog Posts

To add a new blog post:

1. Create a new file in the `_posts` directory with the format `YYYY-MM-DD-title.md`.
2. Add the front matter at the top of the file:
   ```yml
   ---
   layout: post
   title: "Your Post Title"
   date: YYYY-MM-DD
   categories: [category1, category2]
   tags: [tag1, tag2]
   ---
   ```
3. Write your post content in Markdown below the front matter.

### Projects

To add a new project:

1. Create a new file in the `_projects` directory with a descriptive name, e.g., `project-name.md`.
2. Add the front matter at the top of the file:
   ```yml
   ---
   layout: project
   title: "Project Title"
   description: "Brief description of the project"
   date: YYYY-MM-DD
   github_link: https://github.com/yourusername/project-repo
   demo_link: https://demo-link-if-available.com
   image: /assets/images/projects/image-name.jpg
   technologies: [tech1, tech2, tech3]
   ---
   ```
3. Write your project description and details in Markdown below the front matter.

## Customization

### Site Configuration

Edit the `_config.yml` file to update:
- Site title and description
- Your personal information
- Social media links
- Theme settings
- Plugin configurations

### Layout and Design

- Modify files in the `_layouts` directory to change page structures
- Edit CSS in the `assets/css/styles.css` file to customize the appearance
- Add custom JavaScript to the `assets/js` directory if needed

### Adding Pages

To add a new page:
1. Create a new `.md` file in the root directory
2. Add front matter:
   ```yml
   ---
   layout: page
   title: Page Title
   permalink: /page-url/
   ---
   ```
3. Add content in Markdown format

## License

[Specify your license here or remove this section if not applicable] 