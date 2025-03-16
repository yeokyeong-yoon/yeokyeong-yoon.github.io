# CSS Snippets for Your Blog

Here are some CSS snippets you can copy and paste into your `assets/main.scss` file to customize specific elements:

## Modern Card Design
```scss
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  }
}
```

## Gradient Buttons
```scss
.gradient-button {
  display: inline-block;
  padding: 10px 20px;
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  color: white;
  border-radius: 50px;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(135deg, #a777e3, #6e8efb);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(107, 142, 251, 0.4);
    color: white;
    text-decoration: none;
  }
}
```

## Hero Section
```scss
.hero {
  padding: 60px 0;
  text-align: center;
  background: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('/assets/images/hero-bg.jpg');
  background-size: cover;
  background-position: center;
  color: white;
  
  h1 {
    font-size: 3rem;
    margin-bottom: 20px;
  }
  
  p {
    font-size: 1.2rem;
    max-width: 600px;
    margin: 0 auto 30px;
  }
}
```

## Timeline
```scss
.timeline {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 2px;
    background: #ddd;
    transform: translateX(-50%);
  }
  
  .timeline-item {
    position: relative;
    margin-bottom: 30px;
    
    .timeline-content {
      width: 45%;
      padding: 20px;
      background: white;
      border-radius: 5px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      
      &.left {
        margin-left: auto;
        margin-right: 50px;
      }
      
      &.right {
        margin-left: 50px;
      }
    }
    
    .timeline-dot {
      position: absolute;
      top: 20px;
      left: 50%;
      width: 15px;
      height: 15px;
      background: #0366d6;
      border-radius: 50%;
      transform: translateX(-50%);
    }
  }
}
```

## Social Media Icons
```scss
.social-icons {
  display: flex;
  justify-content: center;
  margin: 20px 0;
  
  a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    margin: 0 5px;
    border-radius: 50%;
    background: #f5f5f5;
    color: #333;
    transition: all 0.3s ease;
    
    &:hover {
      background: #0366d6;
      color: white;
      transform: translateY(-3px);
    }
  }
}
``` 