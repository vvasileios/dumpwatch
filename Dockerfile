FROM node:24-slim
WORKDIR /app
ENV HOME=/tmp
RUN mkdir node_modules && chmod 777 node_modules
EXPOSE 3000
CMD ["sh", "-c", "if [ ! -f node_modules/.package-lock.json ] || [ package.json -nt node_modules/.package-lock.json ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then npm install --no-audit --no-fund && touch node_modules/.package-lock.json; fi; exec npm run dev:docker"]