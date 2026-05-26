FROM node:20-alpine

WORKDIR /app

# Installer les dépendances
COPY package*.json ./
RUN npm install

# Copier le code source
COPY . .

# Compiler TypeScript
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
