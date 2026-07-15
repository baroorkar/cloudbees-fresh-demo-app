const http = require('http');

const port = process.env.PORT || 3000;

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.end(
    <html>
      <head>
        <title>CloudBees CI Demo</title>
      </head>
      <body style="font-family: Arial; text-align: center; margin-top: 80px;">
        <h1>CloudBees CI Demo Application</h1>
        <h2>Deployment successful!</h2>
        <p>Built with CloudBees CI and deployed to Amazon EKS.</p>
      </body>
    </html>
  );
});

server.listen(port, '0.0.0.0', () => {
  console.log(Application is running on port );
});
