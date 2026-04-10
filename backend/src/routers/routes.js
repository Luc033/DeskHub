const { Router } = require('express');
const routes = Router();
const MessageController = require('../controllers/MessageController');
const ShortcutController = require('../controllers/ShortcutController');
const LinkController = require('../controllers/LinkController');
const EmojiController = require('../controllers/EmojiController');
const AttendanceController = require('../controllers/AttendanceController');
const KpiController = require('../controllers/KpiController');
const SettingController = require('../controllers/SettingController');
const AiController = require('../controllers/aiController');
const NfeController = require('../controllers/NfeController');
const NoteController = require('../controllers/NoteController');
const AlertController = require('../controllers/AlertController');
const AuthController = require('../controllers/AuthController');
const CategoryController = require('../controllers/CategoryController');

// O nosso Porteiro
const authMiddleware = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/auth');
const securityConfig = require('../config/security');
const rateLimit = require('express-rate-limit');


// ✅ Rate limiters específicos
const authLimiter = rateLimit(securityConfig.getRateLimitConfig().auth);

// ✅ Rotas públicas (SEM autenticação)
routes.get('/ping', (req, res) => res.json({ status: 'API Online!' }));

routes.post('/register', authLimiter, AuthController.register);
routes.post('/login', authLimiter, AuthController.login);

// ✅ Rotas que precisam de autenticação
routes.use(authMiddleware);

// ==========================================

// Retorna quem sou eu
routes.get('/me', AuthController.me);
routes.put('/me/profile', AuthController.updateProfile);
routes.put('/me/password', AuthController.updatePassword);
routes.put('/me/avatar', AuthController.updateAvatar);

// Administração de Usuários (Protegidas - somente admin)
routes.get('/users', requireAdmin, AuthController.listUsers);
routes.delete('/users/:id', requireAdmin, AuthController.deleteUser);
routes.put('/users/:id/reset-password', requireAdmin, AuthController.resetUserPassword);

// Cadastros Básicos (Hub)
routes.post('/messages', MessageController.create);
routes.get('/messages', MessageController.index);
routes.delete('/messages/:id', MessageController.delete);
routes.put('/messages/:id', MessageController.update);

routes.post('/shortcuts', ShortcutController.create);
routes.get('/shortcuts', ShortcutController.index);
routes.delete('/shortcuts/:id', ShortcutController.delete);
routes.put('/shortcuts/:id', ShortcutController.update);

routes.post('/links', LinkController.create);
routes.get('/links', LinkController.index);
routes.delete('/links/:id', LinkController.delete);
routes.put('/links/:id', LinkController.update);

routes.post('/emojis', EmojiController.create);
routes.get('/emojis', EmojiController.index);
routes.delete('/emojis/:id', EmojiController.delete);
routes.put('/emojis/:id', EmojiController.update);

// Atendimentos
routes.post('/attendances', AttendanceController.create);
routes.get('/attendances', AttendanceController.index);
routes.put('/attendances/:id/finalize', AttendanceController.finalize);
routes.delete('/attendances/:id', AttendanceController.delete);
routes.put('/attendances/:id', AttendanceController.update);

// Categorias
routes.get('/categories', CategoryController.index);
routes.post('/categories', CategoryController.create);
routes.put('/categories/:id', CategoryController.update);
routes.delete('/categories/:id', CategoryController.delete);

// KPIs
routes.post('/kpis', KpiController.register);
routes.get('/kpis', KpiController.index);

// Configurações (leitura: autenticado, escrita: admin)
routes.get('/settings/system', SettingController.getSystem);
routes.put('/settings/system', requireAdmin, SettingController.updateSystem);
routes.get('/settings/ai', requireAdmin, SettingController.getAi);
routes.put('/settings/ai', requireAdmin, SettingController.updateAi);

// AI
routes.post('/ai/categorize', AiController.categorize);

// NF-e
routes.get('/nfe/download/:chave', NfeController.downloadXML);

// Notes
routes.get('/notes', NoteController.index);
routes.post('/notes', NoteController.create);
routes.put('/notes/:id', NoteController.update);
routes.delete('/notes/:id', NoteController.delete);

// Recados / Alertas
routes.get('/alerts', AlertController.index);
routes.post('/alerts', AlertController.create);
routes.put('/alerts/:id', AlertController.update);
routes.delete('/alerts/:id', AlertController.delete);

module.exports = routes;