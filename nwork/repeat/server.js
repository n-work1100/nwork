const http = require('http');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const ROOT = __dirname;
const PORT = 3000;
const DB_PATH = path.join(ROOT, 'data.db');

const db = new DatabaseSync(DB_PATH);
db.exec(`
CREATE TABLE IF NOT EXISTS questions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  page       TEXT NOT NULL,
  q_num      INTEGER NOT NULL,
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
)
`);

function seed(page, question, answer) {
	const count = db
		.prepare('SELECT COUNT(*) AS c FROM questions WHERE page = ?')
		.get(page).c;
	if (count === 0) {
		db.prepare(
			'INSERT INTO questions (page, q_num, question, answer) VALUES (?, 1, ?, ?)'
		).run(page, question, answer);
		console.log('Seeded page: ' + page);
	}
}

seed('cli', 'Зайти в привілейований режим', 'R1> enable');
seed(
	'py',
	'Зробити порт транковим(магістральним)\nДати дозвіл на проходження всім VLAN',
	'S4(config-if)# switchport mode trunk\nS4(config-if)# switchport mode trunk allowed vlan all\nS4(config-if)# no shutdown'
);
seed(
	'linux',
	'Зробити порт транковим(магістральним)\nДати дозвіл на проходження всім VLAN',
	'S4(config-if)# switchport mode trunk\nS4(config-if)# switchport mode trunk allowed vlan all\nS4(config-if)# no shutdown'
);
seed(
	'english',
	'Зробити порт транковим(магістральним)\nДати дозвіл на проходження всім VLAN',
	'S4(config-if)# switchport mode trunk\nS4(config-if)# switchport mode trunk allowed vlan all\nS4(config-if)# no shutdown'
);

const MIME = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
	'.eot': 'application/vnd.ms-fontobject',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.ico': 'image/x-icon'
};

function readBody(req) {
	return new Promise((resolve, reject) => {
		let data = '';
		req.on('data', (chunk) => {
			data += chunk;
			if (data.length > 1e6) {
				reject(new Error('body too large'));
				req.destroy();
			}
		});
		req.on('end', () => resolve(data));
		req.on('error', reject);
	});
}

function sendJson(res, code, obj) {
	const body = JSON.stringify(obj);
	res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
	res.end(body);
}

const server = http.createServer(async (req, res) => {
	const url = new URL(req.url, 'http://localhost');
	const pathname = decodeURIComponent(url.pathname);

	if (pathname.startsWith('/api/')) {
		if (pathname === '/api/questions' && req.method === 'GET') {
			const page = url.searchParams.get('page') || '';
			const rows = db
				.prepare(
					'SELECT id, page, q_num, question, answer FROM questions WHERE page = ? ORDER BY q_num'
				)
				.all(page);
			return sendJson(res, 200, rows);
		}

		if (pathname === '/api/questions' && req.method === 'POST') {
			try {
				const body = JSON.parse(await readBody(req));
				const page = String(body.page || '');
				const question = String(body.question || '').trim();
				const answer = String(body.answer || '').trim();
				if (!page || !question || !answer) {
					return sendJson(res, 400, {
						error: 'page, question, answer are required'
					});
				}
				const max = db
					.prepare(
						'SELECT COALESCE(MAX(q_num), 0) AS m FROM questions WHERE page = ?'
					)
					.get(page).m;
				const qNum = max + 1;
				const info = db
					.prepare(
						'INSERT INTO questions (page, q_num, question, answer) VALUES (?, ?, ?, ?)'
					)
					.run(page, qNum, question, answer);
				const row = db
					.prepare(
						'SELECT id, page, q_num, question, answer FROM questions WHERE id = ?'
					)
					.get(info.lastInsertRowid);
				return sendJson(res, 201, row);
			} catch (err) {
				return sendJson(res, 400, { error: 'invalid body' });
			}
		}

		if (pathname.startsWith('/api/questions/') && req.method === 'DELETE') {
			const id = parseInt(pathname.split('/').pop(), 10);
			if (!id) return sendJson(res, 400, { error: 'bad id' });
			db.prepare('DELETE FROM questions WHERE id = ?').run(id);
			return sendJson(res, 200, { ok: true });
		}

		return sendJson(res, 404, { error: 'not found' });
	}

	let filePath = path.join(ROOT, pathname === '/' ? 'index.html' : pathname);
	if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
		filePath = path.join(ROOT, 'index.html');
	}
	const ext = path.extname(filePath).toLowerCase();
	res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
	fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
	console.log('repeat server: http://localhost:' + PORT);
});
