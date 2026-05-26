FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Installer les dépendances
COPY package*.json ./
RUN npm install

# Copier le code source
COPY . .

# Compiler TypeScript
RUN npm run build

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push && npm start"]
