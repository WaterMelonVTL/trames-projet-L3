FROM node:20-alpine as build

# Build le frontend
WORKDIR /app/frontend
COPY Front-End-Trame/package*.json ./
RUN npm install
COPY Front-End-Trame/ ./
RUN npm run build

# Préparer le backend
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install --production
COPY server/ ./

# Copier les fichiers compilés du frontend
COPY --from=build /app/frontend/dist ./src/public

# Modifier le chemin du distPath dans le serveur
RUN sed -i 's|../../Front-End-Trame/dist|./public|g' src/index.js

# Exposer le port et démarrer
EXPOSE 3000
CMD ["node", "src/index.js"]