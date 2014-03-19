COS 333 Project
===============

### Authors
Erik Portillo  
Collin Stedman  
Jennie Werner  
Jeffrey Yan  
Glenna Yu  

##### Jennie edit: 3/5/14 @ 12:06 AM
##### Yay - Glenna
##### Jeffrey Was Here

## Module installation
The `node_modules` directory has not been committed. To install dependencies, simply run `npm install`. We ensure that all modules and submodules have interoperable versions using `npm-shrinkwrap.json`. To learn more about this system, [read this short article.](http://blog.nodejs.org/2012/02/27/managing-node-js-dependencies-with-shrinkwrap/)
  
## Developer tools
* A `Gruntfile.js` script has been included to automate basic tasks like linting Javascript and updating `npm-shrinkwrap.json` when new modules are installed. Simply install the `grunt` command [using these instructions](http://gruntjs.com/getting-started#installing-the-cli) and run `grunt watch` either in the background or in a separate terminal window.

## Known issues
* (3/19) HSTS effectiveness has not been verified. It seems it only works for ports 80 and 443, so we must deploy in order to test.
* (3/19) HTTP requests are not redirected to HTTPS.
* (3/19) Flash messages are not enabled.
