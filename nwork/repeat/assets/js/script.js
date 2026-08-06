const page = (location.pathname.match(/(cli|py|linux|english)\.html$/) || [])[1];

function escapeHtml(str) {
	const div = document.createElement('div');
	div.textContent = str;
	return div.innerHTML;
}

function hideAnswer(answerText) {
	answerText.style.visibility = 'hidden';
}

function equalizeHeights() {
	document.querySelectorAll('.content__item').forEach((item) => {
		const questionText = item.querySelector('.question-text');
		const answerText = item.querySelector('.answer-text');
		if (!questionText || !answerText) return;

		const height = Math.max(questionText.offsetHeight, answerText.offsetHeight);
		questionText.style.height = height + 'px';
		answerText.style.height = height + 'px';
	});
}

function updateNumbers() {
	const items = document.querySelectorAll('.content__item');
	const total = items.length;
	items.forEach((item) => {
		const num = item.dataset.num || '1';
		const qNum = item.querySelector('.q-num');
		const aNum = item.querySelector('.a-num');
		if (qNum) qNum.textContent = 'Question ' + num + ' of ' + total;
		if (aNum) aNum.textContent = 'Answer ' + num + ' of ' + total;
	});
}

document.addEventListener('click', (e) => {
	const btn = e.target.closest('.btn-show-hide');
	if (!btn) return;
	const answerText = btn
		.closest('.content__item')
		.querySelector('.answer-text');
	answerText.style.visibility =
		answerText.style.visibility === 'hidden' ? 'visible' : 'hidden';
	equalizeHeights();
});

function buildBlock(row) {
	const item = document.createElement('div');
	item.className = 'content__item q-' + row.q_num;
	item.dataset.num = row.q_num;
	item.innerHTML =
		'<div class="content-question item">' +
			'<span class="q-num"></span>' +
			'<div class="question-text">' + escapeHtml(row.question).replace(/\n/g, '<br>') + '</div>' +
			'<div class="buttons">' +
				'<button class="btn-previous"><<<</button>' +
				'<button class="btn-next">>>></button>' +
			'</div>' +
		'</div>' +
		'<div class="content-answer item">' +
			'<span class="a-num"></span>' +
			'<div class="answer-text">' + escapeHtml(row.answer).replace(/\n/g, '<br>') + '</div>' +
			'<button class="btn-show-hide">Show / Hide</button>' +
		'</div>';
	hideAnswer(item.querySelector('.answer-text'));
	return item;
}

const content = document.querySelector('.content');
const btnNewQuestion = document.querySelector('.btn-new-question');
const btnNewCreate = document.querySelector('.btn-new-create');
const btnNewExit = document.querySelector('.btn-new-exit');
const formInput = document.querySelector('.form-input');
const btnsCreateExit = document.querySelector('.btns-create-exit');
const inputQ = document.querySelector('.input-q');
const inputA = document.querySelector('.input-a');
const newQNum = document.querySelector('.new-q-num');
const newANum = document.querySelector('.new-a-num');

function renderQuestions(list) {
	content.querySelectorAll('.content__item').forEach((el) => el.remove());
	list.forEach((row) => {
		content.insertBefore(buildBlock(row), btnNewQuestion);
	});
	updateNumbers();
	equalizeHeights();
}

async function loadQuestions() {
	try {
		const res = await fetch('/api/questions?page=' + page);
		if (!res.ok) return;
		const list = await res.json();
		renderQuestions(list);
	} catch (err) {}
}

function setEditDeleteVisible(visible) {
	document.querySelectorAll('.btn-edit, .btn-delete').forEach((el) => {
		el.style.display = visible ? 'block' : 'none';
	});
}

function showForm() {
	const nums = Array.from(document.querySelectorAll('.content__item')).map(
		(el) => parseInt(el.dataset.num, 10) || 0
	);
	const nextNum = (nums.length ? Math.max(...nums) : 0) + 1;
	if (newQNum) newQNum.textContent = 'New question #' + nextNum;
	if (newANum) newANum.textContent = 'Answer to #' + nextNum;
	setEditDeleteVisible(false);
	formInput.style.display = 'flex';
	btnsCreateExit.style.display = 'block';
	void formInput.offsetWidth;
	formInput.classList.add('is-visible');
	btnsCreateExit.classList.add('is-visible');
}

function hideForm() {
	formInput.classList.remove('is-visible');
	btnsCreateExit.classList.remove('is-visible');
	formInput.style.display = 'none';
	btnsCreateExit.style.display = 'none';
	setEditDeleteVisible(true);
}

async function createQuestion() {
	const question = inputQ.value.trim();
	const answer = inputA.value.trim();
	if (!question || !answer) return;
	try {
		const res = await fetch('/api/questions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ page, question, answer })
		});
		if (!res.ok) return;
		await loadQuestions();
		inputQ.value = '';
		inputA.value = '';
		hideForm();
	} catch (err) {}
}

if (page && btnNewQuestion && formInput && btnsCreateExit) {
	btnNewQuestion.addEventListener('click', showForm);
}

if (page && btnNewCreate && inputQ && inputA) {
	btnNewCreate.addEventListener('click', createQuestion);
}

if (page && btnNewExit && formInput && btnsCreateExit) {
	btnNewExit.addEventListener('click', hideForm);
}

window.addEventListener('resize', equalizeHeights);

if (page) {
	loadQuestions();
}
