# `backend/src/routes/contactRoutes.js` — rota do formulário de contacto

## Papel no projeto
Endpoint do formulário "Contacte-nos". Montado em `/api/contact`. **É a única rota pública do backend** (sem `verifyToken`), porque a página de contacto é acessível sem login. Introduzido na FASE E (commit `95d17be7`).

## Conteúdo
```js
router.post('/', contactController.sendContactMessage);
```
| Método | Caminho | Auth | Função | Para quê |
|---|---|---|---|---|
| POST | `/api/contact/` | **pública** | `sendContactMessage` | Enviar a mensagem do formulário por email. |

## Nota de segurança
Por ser pública, o `contactController` faz **validação e anti-spam** (ver doc do controlador) — necessário porque qualquer um pode chamar esta rota.

## Ligações
- **Controlador:** `contactController.js` → usa `services/emailService.js`.
- **Frontend:** `Contact.jsx`.
