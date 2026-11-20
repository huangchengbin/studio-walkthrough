// 劳模创新工作室 · 最小后端
// 能力：登录（scrypt + HMAC 令牌）、布放数据读写、模型/照片上传、静态资源
// 启动：node server/index.mjs（默认 3001 端口）

import express from 'express'
import cors from 'cors'
import multer from 'multer'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA = path.join(__dirname, 'data')
const UPLOADS = path.join(DATA, 'uploads')
const PORT = Number(process.env.PORT || 3001)
const ADMIN_ACCOUNT = process.env.LAOMO_ADMIN || 'admin'
const ADMIN_PASSWORD = process.env.LAOMO_PASSWORD || 'laomo2026'
const TOKEN_TTL = 7 * 24 * 3600 * 1000

fs.mkdirSync(UPLOADS, { recursive: true })

const readJSON = (p, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return fallback
  }
}
const writeJSON = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2))

// ---------- 密钥与账号 ----------
const secretFile = path.join(DATA, 'secret')
let SECRET
if (fs.existsSync(secretFile)) {
  SECRET = fs.readFileSync(secretFile, 'utf8').trim()
} else {
  SECRET = crypto.randomBytes(32).toString('hex')
  fs.writeFileSync(secretFile, SECRET, { mode: 0o600 })
}

const usersFile = path.join(DATA, 'users.json')
let users = readJSON(usersFile, null)
if (!users) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(ADMIN_PASSWORD, salt, 64).toString('hex')
  users = { [ADMIN_ACCOUNT]: { salt, hash } }
  writeJSON(usersFile, users)
  console.log(`[init] 已创建管理员 ${ADMIN_ACCOUNT}（口令来自 LAOMO_PASSWORD 或默认值）`)
}

const layoutFile = path.join(DATA, 'layout.json')
const assetsFile = path.join(DATA, 'assets.json')
const readAssets = () => readJSON(assetsFile, {})

// ---------- 令牌 ----------
const b64 = (buf) => Buffer.from(buf).toString('base64url')
function sign(payload) {
  const body = b64(JSON.stringify(payload))
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url')
  return `${body}.${sig}`
}
function verify(token) {
  if (!token || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  const expect = crypto.createHmac('sha256', SECRET).update(body).digest('base64url')
  if (sig !== expect) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString())
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}
function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const payload = verify(token)
  if (!payload) return res.status(401).json({ error: '未登录或登录已过期' })
  req.user = payload.u
  next()
}

// ---------- 应用 ----------
const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use('/uploads', express.static(UPLOADS, { maxAge: '7d' }))

app.get('/api/health', (_req, res) => res.json({ ok: true, version: 1 }))

app.post('/api/login', (req, res) => {
  const { account = '', password = '' } = req.body || {}
  const u = users[account.trim()]
  if (!u) return res.status(401).json({ error: '账号或口令不正确' })
  const hash = crypto.scryptSync(String(password), u.salt, 64)
  const ok = crypto.timingSafeEqual(hash, Buffer.from(u.hash, 'hex'))
  if (!ok) return res.status(401).json({ error: '账号或口令不正确' })
  res.json({ token: sign({ u: account.trim(), exp: Date.now() + TOKEN_TTL }), account: account.trim() })
})

// 布放数据：公开读，登录写
app.get('/api/layout', (_req, res) => res.json(readJSON(layoutFile, {})))
app.put('/api/layout', auth, (req, res) => {
  const data = req.body
  if (!data || typeof data !== 'object') return res.status(400).json({ error: '数据格式错误' })
  writeJSON(layoutFile, data)
  res.json({ ok: true, savedAt: Date.now() })
})

// 资产清单（哪件成果替换过模型/照片）
app.get('/api/assets', (_req, res) => {
  const all = readAssets()
  const out = {}
  for (const [id, v] of Object.entries(all)) {
    out[id] = { model: v.model ? `/uploads/${v.model}` : null, photo: v.photo ? `/uploads/${v.photo}` : null }
  }
  res.json(out)
})

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS),
    filename: (req, file, cb) => {
      const id = String(req.params.id).replace(/[^\w-]/g, '')
      const ext = path.extname(file.originalname || '').toLowerCase() || (file.mimetype.includes('gltf') ? '.glb' : '.jpg')
      cb(null, `${id}-${Date.now()}${ext}`)
    },
  }),
  limits: { fileSize: 80 * 1024 * 1024 },
})
app.post('/api/assets/:id/model', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未收到文件' })
  const all = readAssets()
  const old = all[req.params.id]?.model
  if (old && fs.existsSync(path.join(UPLOADS, old))) fs.unlinkSync(path.join(UPLOADS, old))
  all[req.params.id] = { ...all[req.params.id], model: req.file.filename }
  writeJSON(assetsFile, all)
  res.json({ url: `/uploads/${req.file.filename}` })
})
app.post('/api/assets/:id/photo', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未收到文件' })
  const all = readAssets()
  const old = all[req.params.id]?.photo
  if (old && fs.existsSync(path.join(UPLOADS, old))) fs.unlinkSync(path.join(UPLOADS, old))
  all[req.params.id] = { ...all[req.params.id], photo: req.file.filename }
  writeJSON(assetsFile, all)
  res.json({ url: `/uploads/${req.file.filename}` })
})
app.delete('/api/assets/:id', auth, (req, res) => {
  const all = readAssets()
  const entry = all[req.params.id]
  if (entry) {
    for (const f of [entry.model, entry.photo]) {
      if (f && fs.existsSync(path.join(UPLOADS, f))) fs.unlinkSync(path.join(UPLOADS, f))
    }
    delete all[req.params.id]
    writeJSON(assetsFile, all)
  }
  res.json({ ok: true })
})

// 生产：顺带托管构建产物
const distDir = path.join(__dirname, '..', 'web', 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get(/^(?!\/api|\/uploads).*/, (_req, res) => res.sendFile(path.join(distDir, 'index.html')))
}

app.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT}  data=${DATA}`)
  if (fs.existsSync(distDir)) console.log('[server] 同时托管 web/dist')
})
