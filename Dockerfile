FROM node:24-slim
WORKDIR /app
ENV HOME=/tmp
RUN mkdir node_modules && chmod 777 node_modules
EXPOSE 3000
CMD ["sh", "-c", "npm install && npm run dev"]