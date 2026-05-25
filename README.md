# Hayusten Finance

Plataforma SaaS de gestão financeira pessoal para o mercado moçambicano e PALOP.

## Stack Tecnológica

| Camada | Tecnologias |
|--------|-------------|
| **Backend** | Node.js 20+, Express.js, MySQL 8, Drizzle-ORM |
| **Cache/Filas** | Redis (3 instâncias separadas), BullMQ |
| **Pagamentos** | Stripe, M-Pesa (Vodacom MZ), Emola (Movitel) |
| **IA** | Claude API (Anthropic) |
| **Frontend** | React 18, React Router v7, Zustand, Tailwind CSS v4 |
| **Emails** | Nodemailer + SMTP |
| **Observabilidade** | Winston, Sentry, PM2 |
| **Deploy** | VPS + Nginx + Cloudflare |

## Estrutura do Repositório

```
/
├── backend/                  ← API Node.js + Express
├── frontend-assinantes/      ← App React para os assinantes
├── frontend-admin/           ← App React para a equipa interna
├── ecosystem.config.cjs      ← Configuração PM2
└── nginx.conf.example        ← Exemplo de configuração Nginx
```

## Configuração Inicial

### Backend

```bash
cd backend
cp .env.example .env
# Preencher as variáveis de ambiente
npm install
npm run db:migrate    # Cria as tabelas na BD
npm run dev           # Desenvolvimento
```

### Frontend Assinantes

```bash
cd frontend-assinantes
npm install
npm run dev           # http://localhost:5173
```

### Frontend Admin

```bash
cd frontend-admin
npm install
npm run dev           # http://localhost:5174
```

## Variáveis de Ambiente

Consultar `backend/.env.example` para todas as variáveis obrigatórias.

As variáveis críticas são:
- `DB_*` — Conexão MySQL
- `REDIS_URL` — Redis (mesma instância, DBs separadas por prefixo)
- `JWT_SECRET` — Mínimo 64 caracteres aleatórios
- `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET`
- `ANTHROPIC_API_KEY` — Para funcionalidades de IA
- `SMTP_*` — Servidor de email
- `ADMIN_SECRET_KEY` — Chave secreta do painel admin

## Deploy em Produção

### Pré-requisitos
- VPS Ubuntu 22.04+
- Node.js 20+
- MySQL 8+
- Redis 7+
- PM2 (`npm install -g pm2`)
- Nginx

### Passos

```bash
# 1. Clonar e instalar
git clone https://github.com/nhanombedercio/Hayusten_Finance.git /var/www/hayusten
cd /var/www/hayusten

# 2. Backend
cd backend && npm install --production
cp .env.example .env  # Preencher variáveis
npm run db:migrate

# 3. Build dos frontends
cd ../frontend-assinantes && npm install && npm run build
cd ../frontend-admin && npm install && npm run build

# 4. Iniciar com PM2
cd /var/www/hayusten
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup

# 5. Configurar Nginx
cp nginx.conf.example /etc/nginx/sites-available/hayusten
# Editar domínios e certificados SSL
ln -s /etc/nginx/sites-available/hayusten /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## Arquitectura Multi-Tenant

Todos os utilizadores partilham a mesma base de dados MySQL. O isolamento é feito
exclusivamente por código — **cada query deve incluir filtro `tenantId`**.

O `tenantId` chega sempre via JWT → middleware `autenticacao.js` → `req.usuario.tenantId`
→ middleware `tenant.js` → `req.tenant.id`. **Nunca aceitar `tenantId` de `req.body` ou `req.query`.**

## Segurança

- Helmet com CSP activado como primeiro middleware
- Rate limiting: 100 req/min geral, 10 req/min auth, 20 req/hora IA
- CORS configurado por `CORS_ORIGENS` no `.env`
- Webhook Stripe com verificação de assinatura e deduplicação BullMQ
- Refresh tokens armazenados em Redis (não na BD) com revogação por tenant
- Eliminação RGPD: anonimização de PII (não eliminação de registos)

## Licença

Uso interno — Hayusten Finance © 2026
